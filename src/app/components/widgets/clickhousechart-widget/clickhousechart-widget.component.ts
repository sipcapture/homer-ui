import { SettingClickhouseChartWidgetComponent } from './setting-clickhousechart-widget.component';

import { CdkVirtualScrollViewport, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CustomVirtualScrollStrategy } from '@app/components/search-grid-call';
import { Functions } from '@app/helpers/functions';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { WorkerCommands } from '@app/models/worker-commands.module';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '@app/services';
import { ClickhouseSerivce } from '@app/services/clickhouse.service';
import { WorkerService } from '@app/services/worker.service';
import { ChartDataSets, ChartType } from 'chart.js';
import { BaseChartDirective, Label } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { IWidget } from '../IWidget';
@Component({
    selector: 'app-clickhousechart-widget',
    templateUrl: './clickhousechart-widget.component.html',
    styleUrls: ['./clickhousechart-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: VIRTUAL_SCROLL_STRATEGY, useClass: CustomVirtualScrollStrategy }]
})
@Widget({
    title: 'Clickhouse',
    description: 'Display Clickhouse Metrics',
    category: 'Metrics',
    indexName: 'clickhousechart',
    className: 'ClickhouseChartWidgetComponent',
    minHeight: 300,
    minWidth: 300,

})
export class ClickhouseChartWidgetComponent implements IWidget, OnInit, OnDestroy {
    @ViewChild(BaseChartDirective) private _chart: BaseChartDirective;
    @ViewChild('virtualScroll') virtualScroll: CdkVirtualScrollViewport;
    @ViewChild('virtualScrollbar') virtualScrollbar: ElementRef;
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings = new EventEmitter<any>();

    timeRange: Timestamp;
    public chartLabels: Label[] = [];
    public chartType: ChartType = 'line';
    public chartLegend = true;
    public chartPlugins = [];
    public chartData: ChartDataSets[] = [{
        fill: false,
        data: [],
        label: ''
    }];
    requestData: any;
    noChartData = true;
    multiDataArr: Array<any> = [];
    isConfig = true;
    private subscription: Subscription;
    legendItems: any;
    _isLoaded = false;
    legendHidden = false;
    private ScrollTarget: string;
    public chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1,
            onComplete: () => {
                this.generateLegend();
            }
        },
        scales: {
            yAxes: [{
                stacked: true,
                ticks: {
                    callback: this.yAxisFormatter.bind(this),
                    beginAtZero: true
                }
            }]
        },
        hover: {
            mode: 'point',
            animationDuration: 0 // duration of animations when hovering an item
        },
        elements: {
            line: {
                tension: 0
            }
        },
        tooltips: {
            callbacks: {
                label: (tooltipItem, data) => {
                    let label = data.datasets[tooltipItem.datasetIndex].label || '';
                    if (label) {
                        const wordRegex = "[a-zA-Z]+_*[a-zA-Z]*"
                        const functionRegex = new RegExp(`((count\\(${wordRegex}\\))|(avg\\(${wordRegex}\\))|(max\\(${wordRegex}\\))|(min\\(${wordRegex}\\))),\\s`)
                        let text = label.replace(functionRegex, '')
                        text = text.split(', ')
                        const tagCheckRegex = new RegExp(`${wordRegex}:\\s+\\S+`)
                        const labelNumberRegex = new RegExp(`${wordRegex}:\\s+\\S+`)
                        text = text.map(tag => {
                            if (!tagCheckRegex.test(tag)) {
                                return null;
                            } else {
                                return tag;
                            }
                        }).filter(tag => tag !== null);
                        text = text.join(', ');
                        label = text !== '' ? `${text}: ${tooltipItem.value}` : `no tags: ${tooltipItem.value}`
                    }
                    return label;
                }

            }
        },
        legendCallback: (item) => {
            return item.legend.legendItems;
        }
    };
    constructor(
        public dialog: MatDialog,
        private _dtrs: DateTimeRangeService,
        private cdr: ChangeDetectorRef,
        private _cs: ClickhouseSerivce,
 public translateService:TranslateService
    ) {
         translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }
    ngOnInit() {

        WidgetArrayInstance[this.id] = this as IWidget;
        if (!this.config) {
            this.isConfig = false;
            this.config = {
                title: 'Chart',
                chart: { type: { value: 'line' } },
                format: { value: 'number' },
                dataquery: {
                    data: [{
                        sum: false,
                        main: { name: 'cpu', value: 'cpu' },
                        database: 'hepic_data',
                        table: 'sip_transaction_call',
                        timeColumn: 'record_datetime',
                        counter: 'duration',
                        tags: ['geo_cc'],
                        operator: 'count()',
                        raw: '',
                        autoMode: true,
                        limit: ''
                    }]
                },
                panel: {
                    queries: [{
                        name: 'A1',
                        type: { name: 'Clickhouse', alias: 'Clickhouse' },
                        database: { name: 'hepic_data' },
                        table: { name: 'sip_transaction_call' },
                        value: 'query'
                    }]
                },
                timeRange: {}
            };
        }
        this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {
            this.timeRange = this._dtrs.getDatesForQuery();
            this.config.timeRange = this.timeRange;
            this.update(this.config.chart.type.value);
            this.cdr.detectChanges();
        });
    }
    ngOnDestroy() {

    }
    generateLegend() {
        if (typeof this._chart !== 'undefined' && typeof this._chart.chart !== 'undefined') {
            this.legendItems = this._chart.chart.generateLegend();
            this.legendItems.forEach((item: any) => {

                const wordRegex = "[a-zA-Z]+_*[a-zA-Z]*";
                const functionRegex = new RegExp(`((count\\(${wordRegex}\\))|(avg\\(${wordRegex}\\))|(max\\(${wordRegex}\\))|(min\\(${wordRegex}\\))),\\s`);
                const [functionCopy] = item.text.match(`((count\\(${wordRegex}\\))|(avg\\(${wordRegex}\\))|(max\\(${wordRegex}\\))|(min\\(${wordRegex}\\)))`)
                let text = item.text.replace(functionRegex, '');
                text = text.split(', ');
                const tagCheckRegex = new RegExp(`${wordRegex}:\\s+\\S+`)
                text = text.map(tag => {
                    if (!tagCheckRegex.test(tag)) {
                        return null;
                    } else {
                        return tag;
                    }
                }).filter(tag => tag !== null);
                text = text.join(', ');
                item.text = text !== '' ? text : functionCopy;
            })
            this.cdr.detectChanges();
        }
    }
    hideDataset(index, event) {
        const hidden = this.legendItems[index].hidden;
        this.legendItems[index].hidden = !hidden;
        this._chart.hideDataset(index, !hidden);

        /* if(!event.ctrlKey) { // Grafana-like legend behavior (normal click hides everything except click-target, ctrl-click hides the target), very high impact on performance
            this.legendItems.forEach((item: any) => {
                if(item.datasetIndex !== index) {
                    this.legendItems[index].hidden = !item.hidden;
                    this._chart.hideDataset(item.datasetIndex, !item.hidden);
                } else {
                    this.legendItems[index].hidden = false;
                    this._chart.hideDataset(item.datasetIndex, false);
                }
            });
        } else {
            this.legendItems[index].hidden = !hidden;
            this._chart.hideDataset(index, !hidden);
        } */
    }
    openDialog(): void {
        this.dialog.open(SettingClickhouseChartWidgetComponent, {
            width: '800px',
            data: this.config || { empty: true }
        }).afterClosed().toPromise().then(result => {
            if (result) {
                if (!this.config) {
                    this.config = {
                        title: '',
                        chart: { type: { value: '' } },
                        format: { value: '' },
                        dataquery: { data: [] },
                        panel: { queries: [] }
                    };
                }

                this.config.title = result.chartTitle;
                this.config.chart.type.value = result.chartType;
                this.config.format.value = result.format;
                this.config.dataquery.data = result.dataSource.map((item: any) => {
                    return {
                        timeColumn: item.detail.timeColumn,
                        resolution: item.detail.resolution,
                        database: item.database,
                        table: item.table,
                        counter: item.detail.counter,
                        tags: item.detail.tags,
                        operator: item.detail.operator,
                        raw: item.detail.raw || '',
                        autoMode: item.detail.autoMode,
                        limit: item.detail.limit
                    };
                });
                this.config.panel.queries = result.dataSource.map((item: any) => ({
                    name: item.id,
                    type: {
                        name: item.panelDataSource,
                        alias: item.panelDataSource
                    },
                    database: {
                        name: item.database
                    },
                    table: {
                        name: item.table
                    },
                    value: 'query'
                }));
                this.isConfig = true;
                this.update(result.chartType);
                this.changeSettings.emit({
                    config: this.config,
                    id: this.id
                });
            }
        });
        this.cdr.detectChanges();
    }
    update(chartType: any) {
        if (!this.config) {
            return;
        }
        this._isLoaded = false;
        this.multiDataArr = [];
        const request = this.querybuilder(this.config);
        this.getDataByQuery(request, chartType);
        this.cdr.detectChanges();
    }
    querybuilder(config: any) {
        const dataquery: Array<any> = config.dataquery.data;
        const formattedQuery: Array<any> = [];
        dataquery.forEach((item: any) => {
            const timeRange = this._dtrs.getDatesForQuery();
            let operator = item.operator;
            if (item.counter) {
                operator = item.operator.replace('()', `(${item.counter})`);
            }
            const timeDiff = timeRange.to - timeRange.from;
            if (!item.autoMode) {

            } else if (timeDiff < 60) { // under 1 minute
                item.resolution = 1; // 1 second resolution
            } else if (timeDiff < 3600) { // under 1 hour
                item.resolution = 60; // 1 minute resolution
            } else if (timeDiff < 86400) { // under 1 day
                item.resolution = 3600; // 1 hour resolution
            } else if (timeDiff < 604800) { // under 1 week
                item.resolution = 21600; // 6 hours resolution
            } else {
                item.resolution = 86400; // 1 day resolution
            }
            if (!/\w/.test(item.raw)) {
                const query = {
                    item: item,
                    query: `SELECT
                        (intDiv(toUInt32(${item.timeColumn}), ${item.resolution ? item.resolution : '60'}) * ${item.resolution ? item.resolution : '60'}) * 1000 as t,
                        ${item.tags}${item.tags.length > 0 ? ',' : ''}
                        ${operator}
                        FROM ${item.database}.${item.table}
                        WHERE ${item.timeColumn} BETWEEN toDateTime(${timeRange.from}) AND toDateTime(${timeRange.to})
                        GROUP BY t${item.tags.length > 0 ? ',' : ''} ${item.tags}
                        ORDER BY t
                        ${item.limit !== '' && item.limit !== null && typeof item.limit !== 'undefined' ? 'LIMIT' + item.limit : ''}
                        `};
                query.query = query.query.replace(/\s+/g, ' ');
                formattedQuery.push(query);
            } else {
                const query = {
                    item: item,
                    query: item.raw
                };
                query.query = query.query.replace(/\s+/g, ' ');
                formattedQuery.push(query);
            }
        });
        return formattedQuery;
    }
    getDataByQuery(requestList: Array<any>, chartType) {
        const request = requestList.shift();
        if (requestList.length > 0 || request) {
            this._cs.getRawQuery({ query: request.query }).toPromise().then(
                async (res: any) => {

                    if (res && res.data) {
                        let s = await WorkerService.doOnce(WorkerCommands.CLICKHOUSE_PARSE_DATA, Functions.cloneObject(
                            {
                                data: res.data,
                                chartType: chartType
                            }),
                            '@app/workers/clickhouse.worker', this.id);


                        this.multiDataArr = this.multiDataArr.concat(s);
                    }
                    this.getDataByQuery(requestList, chartType)
                },
                err => {
                    console.error('err >> ', err);
                    this._isLoaded = true;
                    this.noChartData = true;
                });
        } else {
            this.renderingChart(this.multiDataArr, chartType);
        }
        this.cdr.detectChanges();
    }
    async renderingChart(data, chartType) {
        const workerResults = await WorkerService.doOnce(WorkerCommands.CLICKHOUSE_PREPARE_RENDER_DATA, Functions.cloneObject(
            {
                data: data,
                chartType: chartType,
                options: Functions.cloneObject(this.chartOptions)
            }),
            '@app/workers/clickhouse.worker');
        // this.chartOptions = workerResults.options;
        this.chartLabels = workerResults.labels;
        chartType = workerResults.chartType;
        this.chartData = workerResults.data;
        this.noChartData = workerResults.noChartData;

        if (chartType === 'area') {
            this.chartOptions.scales.yAxes[0].stacked = true;
            chartType = 'line';
        } else {
            this.chartOptions.scales.yAxes[0].stacked = false;
        }
        setTimeout(() => {
            if (chartType) {
                this.chartType = chartType;
                this._isLoaded = true;
                this.cdr.detectChanges();
            }
        }, 0);
        this.cdr.detectChanges();
    }
    yAxisFormatter(label) {
        switch (this.config.format.value) {
            case 'short':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 4;
                    while (n-- && !(f(n) < num)) { }
                    return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
                })(label);
            case 'bytes':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 6;
                    while (n-- && !(f(n) < num)) { }
                    return ((n === 0 ? num : Math.round(num / f(n)) + ('KMGTP'.split('')[n - 1])) || num.toFixed(0)) + 'b';
                })(label);

        }
        return label; // DEFAULT: type == 'number' | 'row':
    }
    hideLegend() {
        this.legendHidden = !this.legendHidden;
        setTimeout(() => {
            this._chart.chart.resize();
        }, 100);
    }
    onScroll({ deltaY }) {
        if (typeof deltaY !== 'undefined') {
            this.virtualScroll.scrollToOffset(this.virtualScroll.measureScrollOffset('start') + deltaY * 1.5, 'smooth');
            return;
        }
    }
    get getVirtualScrollHeight(): string {
        const _h = Math.floor((this.virtualScroll && this.virtualScroll.elementRef.nativeElement.scrollHeight || 1));
        return `translateY(${_h}px)`;
    }
    setScrollTarget(targetString: string) {
        this.ScrollTarget = targetString;
    }
}
