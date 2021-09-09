import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    ElementRef,
    SimpleChanges,
    ViewChild,
    OnDestroy,
    OnChanges,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Functions, setStorage } from '@app/helpers/functions';
import { ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { DashboardService } from '@app/services';
import { ConstValue, UserConstValue } from '@app/models/const-value.model';

export interface GridChartData {
    apicol: any;
    apipoint: any;
    columns: any;
    idParent?: string;
    agGridSizeControl?: any;
}
export interface GridChartConfig {
    axisY: string;
    axisX: string;
    axisLabelX: string;
    axisLabelY: string;
    axisTypeX: string;
    axisTypeY: string;
    chartType: string;
    chartSubType: string;
    chartTitle: string;
}

@Component({
    selector: 'app-grid-chart-dialog',
    templateUrl: 'grid-chart-dialog.component.html',
    styleUrls: ['./grid-chart-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogChartGridDialogComponent
    implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    chartReady = true;
    public apiColumn: any;
    apiPoint: any;
    public options: any;
    isBrowserWindow = false;
    _isLoaded = true;
    agGridSizeControl: any = {};
    allColumnIds: Array<any> = [];
    _bufferData: Array<any>;
    gridData = [];
    isShowPanelSettings = false;
    groupColumnAxis1: string;
    keysArray = [];
    labelsArray = [];
    fillsArray = [];
    strokesArray = [];
    chartType = 'column';
    chartSubType = 'column_stacked';
    chartTitle = 'Source: homer 3.0 Report';
    chartSeries = [];
    chartAxes = [];
    xKey = 'date';
    labelKey = 'from_user';
    angelKey = 'duration';
    axisY = 'duration';
    axisX = 'from_user';
    axisLabelY = 'Total minutes';
    axisLabelX = 'From user';
    axisTypeY = 'number';
    axisTypeX = 'category';
    chartSideY = 'Vertical';
    chartSideX = 'Horizontal';

    _interval: any;
    lastTimestamp: any;
    noData = true;
    public subscriptionDashboardEvent: Subscription;
    @Input() titleId: string;
    @Input() headerColor: any;
    @Input() mouseEventData: any;
    @Input() gridApiData: {};
    @Input() config: GridChartConfig;
    @Input() inChartContainer = false;
    @Input() id: string;
    @Input('isLoaded')
    set isLoaded(val) {
        this._isLoaded = val;
    }
    get isLoaded(): boolean {
        return this._isLoaded;
    }

    @Output() changeSettings: EventEmitter<any> = new EventEmitter();
    @Output() openMessage: EventEmitter<any> = new EventEmitter();
    @Output() close: EventEmitter<any> = new EventEmitter();
    @ViewChild('filterContainer', { static: false })
    filterContainer: ElementRef;
    dataLogs: Array<any>;

    chartTypeList = [
        'line',
        'bar',
        'column',
        'pie',
    ];
    chartSubTypeList = [
        'line',
        'bar_grouped',
        'bar_stacked',
        'column_grouped',
        'column_stacked',
        'pie',
    ];
    axisTypeList = [
        {
            value: 'category',
            name: 'General',
        },
        {
            value: 'time',
            name: 'Time and Date'
        }, {
            value: 'number',
            name: 'Number'
        }
    ];

    objChart = {
        chartData: [
            {
                label: '',
                data: [],
            },
        ],
        chartLabels: [],
        chartOptions: {
            legend: {
                labels: {
                    usePointStyle: true,
                },
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 250,
            },
            scales: {
                yAxes: [
                    {
                        stacked: false,
                    },
                ],
            },
        },
        chartLegend: true,
        chartType: 'line',
    };
    columnKeys = [];
    constructor(
        private cdr: ChangeDetectorRef,
        private dashboardService: DashboardService
    ) { }
    ngOnInit() {
        if (!this.inChartContainer) {
            let ls: any;
            try {
                ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.RESULT_CHART_SETTING)) ||
                    Functions.JSON_parse(localStorage.getItem(ConstValue.RESULT_CHART_SETTING));
                if (ls !== null) {
                    this.axisX = ls.axisX || 'from_user';
                    this.axisY = ls.axisY || 'duration';
                    this.axisLabelX = ls.axisLabelX || 'From user';
                    this.axisLabelY = ls.axisLabelY || 'Total minutes';
                    this.axisTypeX = this.axisTypeList.some(item => item.value === ls.axisTypeX) ? ls.axisTypeX : 'category';
                    this.axisTypeY = this.axisTypeList.some(item => item.value === ls.axisTypeY) ? ls.axisTypeY : 'number';
                    this.chartType = this.chartTypeList.some(item => item === ls.chartType) ? ls.chartType : 'column';
                    this.chartSubType = this.chartSubTypeList.some(item => item === ls.chartSubType) ? ls.chartSubType : 'column_stacked';
                    this.chartTitle = ls.chartTitle || 'Results chart';
                }
            } catch (err) {
                console.error('Settings were corrupted, resetting to default');
            }

        } else {
            if (
                this.config &&
                this.config !== null &&
                typeof this.config !== undefined
            ) {
                this.axisX = this.config.axisX;
                this.axisY = this.config.axisY;
                this.axisLabelX = this.config.axisLabelX;
                this.axisLabelY = this.config.axisLabelY;
                this.axisTypeX = this.config.axisTypeX;
                this.axisTypeY = this.config.axisTypeY;
                this.chartType = this.config.chartType;
                this.chartSubType = this.config.chartSubType;
                this.chartTitle = this.config.chartTitle;
            }
        }
        this.updateChartType(this.chartSubType);
        this.subscriptionDashboardEvent = this.dashboardService.dashboardEvent.subscribe(data => {
            const ls = localStorage.getItem(UserConstValue.SQWR) ||
                localStorage.getItem(ConstValue.SQWR);
            if (ls !== null || typeof ls !== 'undefined') {
                this.noData = false;
            }
            if (!this.inChartContainer) {
                return;
            }
            if (this._interval) {
                clearTimeout(this._interval);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this.cdr.detectChanges();
    }
    ngAfterViewInit() {
        this.cdr.detectChanges();
    }
    ngOnDestroy() {
        this.options = [];
        if (this.subscriptionDashboardEvent) {
            this.subscriptionDashboardEvent.unsubscribe();
        }
    }

    calculateDataForChart() {
        this.apiColumn = this.gridApiData['columnApi'];
        this.apiPoint = this.gridApiData['api'];
        this.gridData = [];
        // this.id = data.idParent;
        if (
            typeof this.apiColumn.getAllColumns() !== 'undefined' &&
            this.apiColumn.getAllColumns() !== null
        ) {
            Object.values(this.apiColumn.getAllColumns() as Object)
                .filter((column) => !['', 'id'].includes(column.colDef.field))
                .forEach((column) =>
                    this.allColumnIds.push({
                        name: column.colDef.headerName,
                        field: column.colDef.field,
                        selected: column.visible,
                    })
                );
            this.allColumnIds = this.allColumnIds
                .map((i) => JSON.stringify(i))
                .sort()
                .filter((i, k, arr) => i !== arr[k - 1])
                .map((i) => Functions.JSON_parse(i));

            this._bufferData = Functions.cloneObject(this.allColumnIds);
            if (!this._bufferData.some(item => item.field === this.axisX)) {
                this.axisX = 'from_user';
            }
            if (!this._bufferData.some(item => item.field === this.axisY)) {
                this.axisY = 'duration';
            }
        }
        const rowData = {};
        const keyData = {};
        const _keysArray = [];
        const _labelsArray = [];
        const _fillsArray = [];
        const _strokesArray = [];
        if (this.chartType === 'pie') {
            this.apiPoint.forEachNode((node) => {
                const dataPointKey = node.data[this.axisX];
                let kValue = rowData.hasOwnProperty(dataPointKey)
                    ? rowData[dataPointKey]
                    : 0;
                kValue += node.data.duration;
                rowData[dataPointKey] = kValue;

                if (_keysArray.indexOf(dataPointKey) === -1) {
                    _keysArray.push(dataPointKey);
                    _fillsArray.push(
                        '#' +
                        Functions.getColorByStringHEX(
                            kValue + ' ' + Functions.md5(kValue)
                        )
                    );
                    _strokesArray.push('#ffffff');
                }
            });

            this.labelKey = this.axisX;
            this.angelKey = this.axisY;

            for (const [key, value] of Object.entries(rowData)) {
                const elem = {};
                elem[this.axisX] = key;
                elem[this.axisY] = value;
                this.gridData.push(elem);
            }
        } else if (this.chartType === 'line') {
            this.apiPoint.forEachNode((node) => {
                const dataPointKey = node.data.create_date;
                const kValue = rowData.hasOwnProperty(dataPointKey)
                    ? rowData[dataPointKey]
                    : {};
                const axisXKey = node.data[this.axisX];
                let sValue = kValue.hasOwnProperty(axisXKey)
                    ? kValue[axisXKey]
                    : 0;
                sValue += node.data.duration;
                kValue[axisXKey] = sValue;
                const rowClone = {};
                rowClone[this.axisX] = axisXKey;
                rowClone[axisXKey] = sValue;
                rowData[dataPointKey] = rowClone;
                if (_keysArray.indexOf(axisXKey) === -1) {
                    _keysArray.push(axisXKey);
                    const myColorStroke =
                        '#' +
                        Functions.getColorByStringHEX(
                            axisXKey + ' ' + Functions.md5(axisXKey)
                        );
                    const sElem = {
                        type: 'line',
                        xKey: 'date',
                        yKey: axisXKey,
                        stroke: myColorStroke,
                        marker: {
                            stroke: myColorStroke,
                            fill: myColorStroke,
                        },
                    };
                    _strokesArray.push(sElem);
                }
            });

            for (const [key, value] of Object.entries(rowData)) {
                const dateKey: number = +key;
                value[this.xKey] = new Date(dateKey);
                this.gridData.push(value);
            }
        } else {
            this.apiPoint.forEachNode((node, i) => {
                const dataPointKey = node.data.create_date;
                const kValue = rowData.hasOwnProperty(dataPointKey)
                    ? rowData[dataPointKey]
                    : {};
                const axisXKey = node.data[this.axisX];
                const sValue = node.data[this.axisY];
                if (
                    this.chartSubType === 'column_grouped' ||
                    this.chartSubType === 'bar_grouped'
                ) {
                    const indexedXKey = axisXKey + '_!' + i;
                    kValue[indexedXKey] = sValue;
                    const rowClone = {};
                    rowClone[this.axisX] = indexedXKey;
                    rowClone[indexedXKey] = sValue;
                    rowClone['value'] = sValue;
                    rowData[dataPointKey] = rowClone;
                    if (_keysArray.indexOf(indexedXKey) === -1) {
                        _keysArray.push(indexedXKey);
                        _labelsArray.push(axisXKey);
                        _fillsArray.push(
                            '#' +
                            Functions.getColorByStringHEX(
                                axisXKey + ' ' + Functions.md5(axisXKey)
                            )
                        );
                        _strokesArray.push('#ffffff');
                    }
                } else {
                    kValue[axisXKey] = sValue;
                    const rowClone = {};
                    rowClone[this.axisX] = axisXKey;
                    rowClone[axisXKey] = sValue;
                    rowClone['value'] = sValue;
                    rowData[dataPointKey] = rowClone;
                    if (_keysArray.indexOf(axisXKey) === -1) {
                        _keysArray.push(axisXKey);
                        _labelsArray.push(axisXKey);
                        _fillsArray.push('#' + Functions.getColorByStringHEX(axisXKey + ' ' + Functions.md5(axisXKey)));
                        _strokesArray.push('#ffffff');
                    }
                }
            });
            for (const [key, value] of Object.entries(rowData)) {
                this.gridData.push(value);
            }
            this.gridData.sort((a, b) => b.value - a.value);
        }
        if (
            _keysArray.length !== 0 &&
            typeof _keysArray !== undefined &&
            _keysArray !== null
        ) {
            this.keysArray = Functions.cloneObject(_keysArray);
            this.labelsArray = Functions.cloneObject(_labelsArray);
            this.fillsArray = Functions.cloneObject(_fillsArray);
            this.strokesArray = Functions.cloneObject(_strokesArray);
        }
        this.cdr.detectChanges();
    }

    onClose() {
        this.close.emit();
        this.cdr.detectChanges();
    }

    onBrowserWindow(event) {
        this.isBrowserWindow = event;
        this.cdr.detectChanges();
    }

    isTimestamp(n = null) {
        const m = (n + '').match(/\d{2}/g);
        if (m) {
            return +m[0] >= 15 && (n + '').length === 10;
        }
        return false;
    }

    updateChartType(type: string) {
        this.chartSubType = type;
        this.sendChartType();
        this.calculateDataForChart();
        this.setOptionsForChart();

        this.options = {
            autoSize: true,
            data: this.gridData,
            title: {
                text: this.chartTitle,
                fontSize: 18,
            },
            series: this.chartSeries,
            axes: this.chartAxes,
            legend: {
                spacing: 40,
                position: 'bottom',
            },
        };
        this.chartReady = false;
        setTimeout(() => {
            this.chartReady = true;
            this.cdr.detectChanges();
        }, 35);
        this.cdr.detectChanges();
        this.settingsChanged();
    }
    settingsChanged() {
        const config = {
            axisX: this.axisX,
            axisY: this.axisY,
            axisLabelX: this.axisLabelX,
            axisLabelY: this.axisLabelY,
            axisTypeX: this.axisTypeX,
            axisTypeY: this.axisTypeY,
            chartType: this.chartType,
            chartSubType: this.chartSubType,
            chartTitle: this.chartTitle,
        };
        if (!this.inChartContainer) {
            setStorage(UserConstValue.RESULT_CHART_SETTING, config);
        } else {
            this.changeSettings.emit(config);
        }
    }

    sendChartType() {
        const type = this.chartSubType;

        if (type === 'column_grouped') {
            this.chartType = 'column';
        } else if (type === 'column_stacked') {
            this.chartType = 'column';
        } else if (type === 'column_stacked_100') {
            this.chartType = 'column';
        } else if (type === 'bar_grouped') {
            this.chartType = 'bar';
        } else if (type === 'bar_stacked') {
            this.chartType = 'bar';
        } else if (type === 'bar_stacked_100') {
            this.chartType = 'bar';
        } else if (type === 'pie_normal') {
            this.chartType = 'pie';
        } else if (type === 'pie_donut') {
            this.chartType = 'pie';
        } else if (type === 'line_grouped') {
            this.chartType = 'line';
        } else if (type === 'line_stacked') {
            this.chartType = 'line';
        } else if (type === 'line_stacked_100') {
            this.chartType = 'line';
        }
    }

    setOptionsForChart() {
        const type = this.chartSubType;

        if (this.chartType === 'column') {
            this.chartSideX = 'Horizontal';
            this.chartSideY = 'Vertical';

            this.chartSeries = [
                {
                    type: this.chartType,
                    grouped: false,
                    xKey: this.axisX,
                    yKeys: this.keysArray,
                    yNames: this.labelsArray,
                    fills: this.fillsArray,
                    strokes: this.strokesArray,
                    tooltipRenderer: params => {
                        return `<div class="ag-chart-tooltip-title" style="background-color:
                        ${params.color}">
                        ${params.yName}</div><div class="ag-chart-tooltip-content">
                        ${params.datum.value}
                        </div>`;
                    },
                },
            ];
            this.chartAxes = [
                {
                    type: 'category',
                    position: 'bottom',
                    title: { text: this.axisLabelX },
                    label: {
                        formatter: params => {
                            if (this.keysArray.length > 10) {
                                return ''
                            }
                            if (typeof params.value === 'string') {
                                return params.value.split('_!')[0];
                            } else {
                                return params.value;
                            }
                        }
                    }
                },
                {
                    type: 'number',
                    position: 'left',
                    title: { text: this.axisLabelY },
                    label: {
                        formatter: (params) => {
                            if (this.axisY === 'duration') {
                                return (params.value / 60).toFixed(2) + ' min';
                            } else {
                                return params.value;
                            }
                        },
                    },
                },
            ];
        } else if (this.chartType === 'bar') {
            this.chartSideX = 'Vertical';
            this.chartSideY = 'Horizontal';

            this.chartSeries = [
                {
                    type: this.chartType,
                    grouped: false,
                    xKey: this.axisX,
                    yKeys: this.keysArray,
                    yNames: this.labelsArray,
                    fills: this.fillsArray,
                    strokes: this.strokesArray,
                },
            ];
            this.chartAxes = [
                {
                    type: this.axisTypeX,
                    position: 'left',
                    title: { text: this.axisLabelX },
                    label: {
                        formatter: params => {
                            if (this.keysArray.length > 10) {
                                return ''
                            }
                            if (typeof params.value === 'string') {
                                return params.value.split('_!')[0];
                            } else {
                                return params.value;
                            }
                        }
                    }
                },
                {
                    type: this.axisTypeY,
                    position: 'bottom',
                    title: { text: this.axisLabelY },
                    label: {
                        formatter: function (params) {
                            return (params.value / 60).toFixed(2) + ' min';
                        },
                    },
                },
            ];
        } else if (this.chartType === 'pie') {
            this.chartSeries = [
                {
                    data: this.gridData,
                    type: this.chartType,
                    labelKey: this.labelKey,
                    angleKey: this.angelKey,
                    label: { minAngle: 0 },
                    callout: { strokeWidth: 2 },
                    fills: this.fillsArray,
                    strokes: this.strokesArray,
                },
            ];
            this.chartAxes = [];
        } else if (this.chartType === 'line') {
            this.axisTypeX = 'time';
            this.chartSeries = this.strokesArray;
            this.chartAxes = [
                {
                    type: 'time',
                    position: 'bottom',
                    label: { format: '%H:%M:%S' },
                },
                {
                    type: 'number',
                    position: 'left',
                    title: { text: 'Total minutes' },
                    label: {
                        formatter: function (params) {
                            return (params.value / 60).toFixed(2) + ' min';
                        },
                    },
                },
            ];
        }
        this.cdr.detectChanges();
    }
    updateTitle() {
        this.options = {
            autoSize: true,
            data: this.gridData,
            title: {
                text: this.chartTitle,
                fontSize: 18,
            },
            series: this.chartSeries,
            axes: this.chartAxes,
            legend: {
                spacing: 40,
                position: 'bottom',
            },
        };
        setTimeout(() => {
            this.cdr.detectChanges();
        }, 35);
        this.settingsChanged();
    }
}
