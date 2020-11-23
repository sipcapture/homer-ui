import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { ChartDataSets, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import {
    DashboardService,
    PreferenceMappingProtocolService,
    SearchCallService,
    DateTimeRangeService
} from '@app/services';
import { Subscription } from 'rxjs';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { MatDialog } from '@angular/material/dialog';
import { SettingResultChartWidgetComponent } from './setting-result-chart-widget.component';
import * as moment from 'moment';

interface ChartOption {
    chartData: ChartDataSets[];
    chartLabels: Label[];
    chartOptions: any;
    chartLegend: boolean;
    chartType: ChartType;
}

interface DataColumn {
    value: string;
    id: number;
    name: string;
}

type SortType = 'SUM' | 'COUNT' | 'MIN' | 'MAX';

@Component({
    selector: 'app-result-chart-widget',
    templateUrl: './result-chart-widget.component.html',
    styleUrls: ['./result-chart-widget.component.scss']
})
@Widget({
    title: 'Display Results Chart',
    description: 'Display Search chart results in Widgets',
    category: 'Visualize',
    indexName: 'display-results-chart',
    className: 'ResultChartWidgetComponent',
    minHeight: 300,
    minWidth: 500
    // settingWindow: false
})
export class ResultChartWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings: EventEmitter<any> = new EventEmitter();

    title: string;
    columnKeysGroupColumn;
    localData: any;
    protocol_profile;
    isLokiQuery;
    queryTextLoki;
    comingRequest;
    dataForChart;
    sortType: SortType = 'SUM';
    _isLoaded = true;
    chartTypeList = [
        'line', 'bar', 'horizontalBar', 'radar',
        'doughnut', 'polarArea', 'pie'
    ];
    isFormattedDateTime = true;
    dataColumns: Array<DataColumn> = [];
    groupColumnAxis1: string;
    noChartData = false;
    numberTypes = 'short';
    isShowPanelSettings = true;
    objChart: ChartOption = {
        chartData: [{
            label: '',
            data: []
        }],
        chartLabels: [],
        chartOptions: {
            legend: {
              labels: {
                usePointStyle: true
              }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 250
            },
            scales: {
                yAxes: [{
                    stacked: false,
                    ticks: {
                        callback: this.yAxisFormatter.bind(this),
                        beginAtZero: false
                    }
                }]
            }
        },
        chartLegend: true,
        chartType: 'line',
    };
    columnKeys = [];
    configQuery = {
        param: {
            transaction: {},
            limit: 200,
            search: {},
            location: {},
            timezone: {
                value: -180,
                name: 'Local'
            }
        },
        timestamp: { from: 0, to: 0 }
    };

    subscriptionDashboardEvent: Subscription;
    subscriptionCastRangeUpdateTimeout: Subscription;

    _lastTimestamp = 0;

    set lastTimestamp(val: number) {
        this._lastTimestamp = val;
    }
    get lastTimestamp() {
        return this._lastTimestamp;
    }

    constructor(
        public dialog: MatDialog,
        private _ds: DashboardService,
        private _pmps: PreferenceMappingProtocolService,
        private _scs: SearchCallService,
        private _dtrs: DateTimeRangeService
    ) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        if (!this.configQuery) {
            this.configQuery = {
                param: {
                    transaction: {},
                    limit: 200,
                    search: {},
                    location: {},
                    timezone: {
                        value: -180,
                        name: 'Local'
                    }
                },
                timestamp: { from: 0, to: 0 }
            };
        }
        this.dataColumns = [{ value: '', id: 0, name: 'A' }];

        const _f = Functions.cloneObject;

        if (this.config) {
            this.title = this.config.title || 'RESULT-CHART';
            this.configQuery = _f(this.config.configQuery);
            this.groupColumnAxis1 = this.config.groupColumnAxis1;
            this.dataColumns = _f(this.config.dataColumns);
            this.localData = _f(this.config.localData);
            this.objChart.chartType = this.config.chartType || this.objChart.chartType;
            this.sortType = this.config.sortType || this.sortType;
            this.isShowPanelSettings = this.config.isShowPanelSettings !== null ?
                this.config.isShowPanelSettings : true;
        }
        this.subscriptionDashboardEvent = this._ds.dashboardEvent.subscribe(this.onDashboardEvent.bind(this));
        this.subscriptionCastRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(this.getData.bind(this));
    }

    private async onDashboardEvent(data: any) {
        const dataId = data.resultWidget[this.id];
               
        if (dataId && dataId.query) {
            if (this.lastTimestamp * 1 === dataId.timestamp * 1) {
                return;
            }
            this.lastTimestamp = dataId.timestamp * 1;

            this.localData = dataId.query;
        }

        this.getData();
    }
    isTimestamp(n = null) {
        if (!n) {
            try {
                n = this.dataForChart[0][this.groupColumnAxis1];
            } catch (err) {
                return false;
            }
        }
        const m = (n + '').match(/\d{2}/g);
        if (m) {
            return +m[0] >= 15 && (n + '').length === 10;
        }
        return false;
    }
    private async getData() {
        if (!this.localData) {
            return;
        }
        this.protocol_profile = this.localData.protocol_id;

        if( this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
            this.configQuery.param.location[this.localData.location.mapping] = this.localData.location.value;
        }

        this.configQuery.param.search[this.protocol_profile] = this.localData.fields;
        this.configQuery.timestamp = this._dtrs.getDatesForQuery(true);

        const dataMapping: any = await this._pmps.getAll().toPromise();
        const result = await this._scs.getData(this.configQuery).toPromise();
     
        const dataMappingItem = dataMapping.data.filter(i =>
            i.profile === this.protocol_profile.split('_')[1]
        )[0];

        if (dataMappingItem && dataMappingItem.fields_mapping) {
            const fields_mapping = dataMappingItem.fields_mapping;

            this.columnKeysGroupColumn = result.keys;
            this.columnKeys = fields_mapping.filter(i => i.type !== 'string').map(i => i.id.split('.')[1]);
            this.dataForChart = result.data;
            
            this.buildChart();
        
           
        }
    }
    private groupByData() {
        const sort_by = this.groupColumnAxis1;

        return Object.values(Functions.cloneObject(this.dataForChart).reduce((a, b) => {
            if (!a[b[sort_by]]) {
                a[b[sort_by]] = [];
            }
            a[b[sort_by]].push(b);
            return a;
        }, {})).map((i: any) => {
            return i.reduce((a, b, index) => {
                if (!a) {
                    a = b;
                }
                Object.keys(a).forEach(j => {
                    if (this.isTimestamp(a[j]) && this.isFormattedDateTime) {
                        a[j] = moment(a[j] * 1000 ).format('HH:mm:ss');
                    } else if (typeof a[j] === 'number' && j !== sort_by) {
                        switch (this.sortType) {
                            case 'SUM':
                                a[j] += b[j];
                                break;
                            case 'COUNT':
                                a[j] = index === 0 ? 1 : a[j] + 1 ;
                                break;
                            case 'MIN':
                                a[j] = Math.min(b[j], a[j]);
                                break;
                            case 'MAX':
                                a[j] = Math.max(b[j], a[j]);
                                break;
                        }
                    }
                });
                return a;
            }, null);
        });
    }
    onChackBox() {
        setTimeout(this.buildChart.bind(this), 30);
    }
    buildChart() {
        if (!this.groupColumnAxis1) {
            return;
        }
        const dataForChart = this.groupByData();
       
        if (dataForChart.length === 1) {
            dataForChart[1] = dataForChart[0];
        }

        const labels = dataForChart.map(i => i[this.groupColumnAxis1]);

        this.objChart.chartLabels.length = 0;
        this.objChart.chartLabels = labels;

        const d = dataForChart.map(i => {
            const _i = {};
            this.columnKeys.forEach(j => {
                _i[j] = i[j];
            });
            return _i;
        });

        const dc = this.dataColumns.filter(i => i.value !== '');
        if (dc.length > 0) {
            this.objChart.chartData = [];
            dc.forEach(item => {
                const label = item.value;
                const data = d.map(i => i[label]);
                if (data) {
                    this.objChart.chartData.push({ label, data });
                
                }
            });
        }
        this.saveConfig();

    }

    onChangeType() {
        this.buildChart();
        this._isLoaded = false;
        setTimeout(() => {
            this._isLoaded = true;
        }, 34);
        this.saveConfig();
    }

    saveConfig() {
        const _f = Functions.cloneObject;
        this.config = {
            title: this.title || this.id,
            configQuery: _f(this.configQuery),
            groupColumnAxis1: this.groupColumnAxis1,
            dataColumns: _f(this.dataColumns),
            chartType: this.objChart.chartType + '',
            localData: this.localData,
            sortType: this.sortType,
            isShowPanelSettings : this.isShowPanelSettings
        };

        this.changeSettings.emit({
            config: _f(this.config),
            id: this.id
        });
    }

    async openDialog() {
        const dialogRef = this.dialog.open(SettingResultChartWidgetComponent, {
            data: {
                title: this.title || this.id,
                sortType: this.sortType
            }
        });

        const result = await dialogRef.afterClosed().toPromise();
        if (!result) {
            return;
        }
        this.sortType = result.sortType;
        this.title = result.title;

        this.buildChart();

        this.saveConfig();
    }

    private yAxisFormatter (label) {
        try {
            switch (this.numberTypes) {
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
        } catch (err) { }

        return label;
    }

    onAddSeries() {
        if ( this.dataColumns.length === 0) {
            this.dataColumns = [{ value: '', id: 0, name: 'A' }];
        } else {
            const lastId = this.dataColumns[this.dataColumns.length - 1].id;
            this.dataColumns.push({ value: '', id: lastId + 1, name: 'B' });
        }
    }
    onDeleteSeries(id: number) {
        this.dataColumns.splice(id, 1);
        this.buildChart();
    }
    ngOnDestroy() {
        this.subscriptionDashboardEvent.unsubscribe();
        this.subscriptionCastRangeUpdateTimeout.unsubscribe();
    }

}
