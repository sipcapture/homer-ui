import { SettingInfluxdbchartWidgetComponent } from './setting-influxdbchart-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { IWidget } from '../IWidget';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

import { ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { StatisticService } from '../../../services/statistic.service';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '../../../services/data-time-range.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { Widget } from '@app/helpers/widget';

@Component({
    selector: 'app-influxdbchart-widget',
    templateUrl: './influxdbchart-widget.component.html',
    styleUrls: ['./influxdbchart-widget.component.css']
})
@Widget({
    title: 'InfluxDB',
    description: 'Display InfluxDB Metrics',
    category: 'Metrics',
    indexName: 'influxdbchart',
    className: 'InfluxdbchartWidgetComponent'
})
export class InfluxdbchartWidgetComponent implements IWidget {
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
        private _ss: StatisticService) { }

    ngOnInit() {
        if (!this.config) {
            this.isConfig = false;
            this.config = {
                title: 'Chart',
                chart: { type: { value: 'line' } },
                format: { value: 'number' },
                dataquery: { data: [{
                    sum: false,
                    main: { name: 'cpu', value: 'cpu' },
                    database: { name: 'telegraf' },
                    retention: { name: 'autogen' },
                    type: [{ name: 'usage_system', value: 'usage_system' }],
                    tag: [],
                    raw: ''
                }]},
                panel: { queries: [{
                    name: 'A1',
                    type: { name: 'influxDB', alias: 'influxDB' },
                    database: { name: 'telegraf' },
                    retention: { name: 'autogen' },
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
    querybuilder (config: any) {
        const dataquery: Array<any> = config.dataquery.data;
        const formattedQuery: Array<any> = [];
        dataquery.forEach(item => {
            formattedQuery.push({
                main: item.main.value + '', // "cpu",
                database: `"${item.database.name}"`, // "\"homer\"",
                retention: `"${item.retention.name}"`, // "\"autogen\"",
                rawquery: item.raw,
                type: item.type.map(i => i.name),
                tag: item.tag.map(i => i.name)
            });
        });

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                filter: ['@filters'],
                limit: 500,
                total: false,
                precision: 3600,
                bfrom: this._dtrs.getDatesForQuery().from,
                query: formattedQuery,
            }
        };
    }
    update (chartType: any) {
        if (!this.config) {
            return;
        }

        this.requestData = this.querybuilder(this.config);
        const queryStack = this.querySeporetor(this.requestData);
        this.multiDataArr = [];
        this.getDataByQuery(queryStack, chartType);

    }
    getDataByQuery(requestList: Array<any>, chartType) {
        const request = requestList.shift();
        if (requestList.length > 0 || request) {
            this._ss.getStatisticData(request).toPromise().then(
                (res: any) => {
                    const {columns, values, name} = res.data.Results[0].Series[0];

                    let s = values.map(i => {
                        const o = {};
                        columns.forEach((j, k) => {
                            o[j] = i[k];
                        });
                        return o;
                    });

                    s = s.map(i => {
                        i.main = name;
                        return i;
                    });

                    this.multiDataArr = this.multiDataArr.concat(s);
                    this.getDataByQuery(requestList, chartType);
                },
                err => {
                    console.error('err >> ', err);
                    this._isLoaded = true;
                    this.noChartData = true;
                });
        } else {
            this.multiDataArr = [].concat(...(Object.values(this.multiDataArr.reduce((a, b) => {
                if (!a[b.time]) {
                    a[b.time] = [];
                }
                a[b.time].push(b);
                return a;
            }, {})).map((i: any[]) => {
                return i.reduce((a, b) => {
                    Object.keys(b).filter(j => j !== 'time' && j !== 'main').forEach(j => a.push({
                        attemps: 1,
                        countername: j,
                        group: 0,
                        id: 0,
                        partid: 10,
                        reporttime: new Date(b.time).getTime(),
                        table: b.main,
                        tag1: '',
                        transaction: 'statistic',
                        value: b[j]
                    }));
                    return a;
                }, []);
            })));
            this.renderingChart(this.multiDataArr, chartType);
        }
    }

    querySeporetor(request) {
        const count = request.param.query.length;
        const querys = [];
        let query: any;
        for (let index = 0; index < count; index++) {
            query = JSON.parse(JSON.stringify(request));
            query.param.query = [request.param.query[index]];
            querys.push(query);
        }
        return querys;
    }
    renderingChart(data, chartType) {
        let isFill;

        if (chartType === 'area') {
            this.chartOptions.scales.yAxes[0].stacked = true;
            isFill = true;
            chartType = 'line';
        } else {
            isFill = false;
            this.chartOptions.scales.yAxes[0].stacked = false;
        }

        this.chartLabels = [];
        this.chartData = [];
        this.noChartData = data.length === 0;

        const formattedData = data.map(i => ({
            label: i.table + '.' + i.countername,
            value: i.value
        })).reduce((a, b) => {
            if (!a[b.label]) {
                a[b.label] = [];
            }
            a[b.label].push(b.value);
            return a;
        }, {});

        this.chartLabels = data
            .map(item => moment(item.reporttime * 1000).format('HH:mm'))
            .filter((i, k, a) => i !== a[k + 1]);

        let fillKey = 0;
        Object.keys(formattedData).forEach(key => {
            const value = formattedData[key];
            this.chartData.push({
                fill: isFill ? ( fillKey === 0 ? 'origin' : fillKey - 1) : false,
                label: key,
                data: value
            });
            fillKey ++;
        });

        setTimeout(() => {
            if (chartType) {
                this.chartType = chartType;
                this._isLoaded = true;
            }
        }, 0);
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(SettingInfluxdbchartWidgetComponent, {
            width: '800px',
            data: this.config || {empty: true}
        });

        const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (!this.config) {
                    this.config = {
                        title: '',
                        chart: { type: { value: '' } },
                        format: { value: ''},
                        dataquery: { data: []},
                        panel: {queries: []}
                    };
                }

                this.config.title = result.chartTitle;
                this.config.chart.type.value = result.chartType;
                this.config.format.value = result.format;
                this.config.dataquery.data = result.dataSource.map(item => ({
                    sum: item.detail.sum,
                    main: {
                        name: item.detail.measurement,
                        value: item.detail.measurement
                    },
                    database: { name: item.database },
                    retention: { name: item.retentionPolicy },
                    type: item.detail.counter.map(i => ({
                        name: i, value: i
                    })),
                    tag: item.detail.tags.map(i => ({
                        name: i, value: i
                    })),
                    raw: item.detail.raw || '',
                }));
                this.config.panel.queries = result.dataSource.map(item => ({
                    name: item.id,
                    type: {
                        name: item.panelDataSource,
                        alias: item.panelDataSource
                    },
                    database: {
                        name: item.database
                    },
                    retention: {
                        name: item.retentionPolicy
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

    public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    }

    public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
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
                    return ((n === 0 ? num: Math.round(num / f(n)) + ('KMGTP'.split('')[n - 1])) || num.toFixed(0)) + 'b';
                })(label);

        }
        return label; // DEFAULT: type == 'number' | 'row':
    }

    ngOnDestroy () {
        this.subscription.unsubscribe();
    }
}
