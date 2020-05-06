import { DateTimeRangeService, DateTimeTick, Timestamp } from '@app/services/data-time-range.service';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import { SettingPrometheusWidgetComponent } from './setting-prometheus-widget.component';
import { PrometheusService } from '@app/services/prometheus.service';
import { MatDialog } from '@angular/material/dialog';
import { ChartType, ChartDataSets } from 'chart.js';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { Subscription } from 'rxjs';
import { Label } from 'ng2-charts';
import * as moment from 'moment';

@Component({
    selector: 'app-prometheus-widget',
    templateUrl: './prometheus-widget.component.html',
    styleUrls: ['./prometheus-widget.component.scss']
})
@Widget({
    title: 'Prometheus',
    description: 'Display an Prometheus Metrics',
    category: 'Metrics',
    indexName: 'prometheuschart',
    advancedName: 'promserver',
    className: 'PrometheusWidgetComponent',
    minHeight: 300,
    minWidth: 300
})
export class PrometheusWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings = new EventEmitter<any> ();

    _isLoaded = false;
    public chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        scales: {
            yAxes: [{
                stacked: true,
                ticks: {
                    callback: this.yAxisFormatter.bind(this),
                    beginAtZero: true
                }
            }]
        }
    };
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

    constructor(
        public dialog: MatDialog,
        private _dtrs: DateTimeRangeService,
        private _ps: PrometheusService,
    ) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        if (!this.config) {
            this.isConfig = false;
            this.config = {
                name: 'prometheuschart',
                title: 'prometheuschart',
                chart: { type: { value: 'line' } },
                format: { value: 'number' },
                dataquery: {
                    data: [{
                        sum: false,
                        prometheusLabels: [],
                        prometheusQuries: ''
                    }]
                },
                panel: { queries: [{
                    name: 'A1',
                    type: { name: 'prometheus', alias: 'prometheus' },
                    value: 'query'
                }]}
            };
            // this.changeSettings.emit({
            //     config: this.config,
            //     id: this.id
            // });
        }

        this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {
            this.timeRange = this._dtrs.getDatesForQuery();
            this.update(this.config.chart.type.value);
        });
    }
    private update (chartType: any) {

        if (!this.config) {
            return;
        }

        this.requestData = this.querybuilder(this.config);

        this._ps.getValue(this.requestData).subscribe((data: any) => {
            this._isLoaded = true;
            this.noChartData = false;

            try {
                let isFill;
                this.chartData = [];
                this.chartLabels = [];

                if (chartType === 'area') {
                    this.chartOptions.scales.yAxes[0].stacked = true;
                    isFill = true;
                    chartType = 'line';
                } else {
                    isFill = false;
                    this.chartOptions.scales.yAxes[0].stacked = false;
                }

                data.forEach(dataItem => {
                    if (!dataItem.data.result || dataItem.data.result.length === 0) {
                        this.noChartData = this.noChartData || false;
                        return;
                    }
                    this.chartLabels = dataItem.data.result[0].values.map(i => moment(i[0]).format('HH:mm:ss'));

                    dataItem.data.result.forEach(_result => {
                        this.chartData.push({
                            fill: isFill,
                            label: _result.metric.__name__,
                            data: _result.values.map(i => i[1] * 1)
                        });
                        this.noChartData = this.noChartData || true;
                    });
                });

                setTimeout(() => {
                    if (chartType) {
                        this.chartType = chartType;
                        this._isLoaded = true;
                    }
                }, 0);

            } catch (err) {
                this.noChartData = false;
            }
            this.noChartData = !this.noChartData;
        });


    }
    private querybuilder (config: any) { /** depricated, need use {SearchService} */
        const dataquery: Array<any> = config.dataquery.data;
        let formattedQuery: Array<any> = [];
        dataquery.forEach(item => {
            formattedQuery = formattedQuery.concat( item.prometheusLabels.map(i => i + encodeURIComponent(item.prometheusQuries) ) );
        });
        formattedQuery = formattedQuery[0] instanceof Array ? formattedQuery[0] : formattedQuery;

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                limit: 500,
                total: false,
                precision: 3600,
                metrics: formattedQuery,
            }
        };
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(SettingPrometheusWidgetComponent, {
            width: '800px',
            data: this.config || {empty: true}
        });

        const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.config.title = result.chartTitle;
                this.config.chart.type.value = result.chartType;
                this.config.format.value = result.format;

                this.config.dataquery.data = result.dataSource.map(item => ({
                    sum: item.detail.sum,
                    prometheusLabels: item.detail.prometheusLabels,
                    prometheusQuries: item.detail.prometheusQuries,
                }));

                this.config.panel.queries = result.dataSource.map(item => ({
                    name: item.id,
                    type: {
                        name: item.panelDataSource,
                        alias: item.panelDataSource
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
            dialogRefSubscription.unsubscribe();
        });
    }

    yAxisFormatter (label) {
        switch (this.config.format.value) {
            case 'short':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 4;
                    while (n-- && !(f(n) < num)) {}
                    return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
                })(label);
            case 'bytes':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 6;
                    while (n-- && !(f(n) < num)) {}
                    return ((n === 0 ? num : Math.round(num / f(n)) + ('KMGTP'.split('')[n - 1])) || num.toFixed(0)) + 'b';
                })(label);

        }
        return label;
    }

    ngOnDestroy () {
        this.subscription.unsubscribe();
    }
}
