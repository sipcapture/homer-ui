import { Component, Inject, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { ClickhouseSerivce } from '@app/services/clickhouse.service';
import { ChartType } from 'chart.js';
import { AlertService } from '@app/services/alert.service';
import { DateTimeRangeService } from '@app/services/data-time-range.service';
import { Functions } from '@app/helpers/functions';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { SelectList, GroupedSelectList } from '../influxdbchart-widget/setting-influxdbchart-widget.component';
import { TranslateService } from '@ngx-translate/core'
export interface ClickhousePeriodicElement {
    id: string;
    panelDataSource: string;
    database: string;
    table: string;
    buttons: boolean;
    detail?: {
        timeColumn?: string;
        resolution?: number;
        counter?: string;
        tags?: Array<string>;
        operator?: string;
        raw?: string;
        autoMode?: boolean;
        limit?: string;
    };
}

@Component({
    selector: 'app-setting-clickhousechart-widget-component',
    templateUrl: 'setting-clickhousechart-widget.component.html',
    styleUrls: ['./setting-clickhousechart-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingClickhouseChartWidgetComponent {
    @ViewChild(MatTable, { static: true }) matTable: MatTable<any>;

    displayedColumns: string[] = ['id', 'panelDataSource', 'database', 'table', 'buttons'];
    dataSource: ClickhousePeriodicElement[] = [];
    detailShow = false;

    chartTypeList = [
        'line', 'bar', 'horizontalBar', 'radar',
        'doughnut', 'polarArea', 'area', 'pie'
    ];

    databaseList: SelectList[] = [];
    tableList: SelectList[] = [];
    timeColumnList: SelectList[] = [];
    counterList: SelectList[] = [];
    tagsList: SelectList[] = [];
    columnList: SelectList[] = [];
    operatorList: SelectList[] = [
        { name: 'Count', value: 'count()' },
        { name: 'Average', value: 'avg()' },
        { name: 'Maximum', value: 'max()' },
        { name: 'Minimum', value: 'min()' }
    ];
    chartTitle: string;
    chartType: string;
    format: string;

    panelDataSource: string;
    database: string;
    table: string;
    rawBuffer: string;

    timeColumn: string;
    resolution: number;
    counter: string;
    tags = new FormControl();
    values = new FormControl();
    operator: string;
    isSum: boolean;
    selectedEditQuery: ClickhousePeriodicElement;
    autoMode: boolean;
    // apiQueryPath: string;
    apiQueryValue: string;
    curlDebug: string;
    curlResponse: string;

    timeRange: any;

    outputObject: any = {};
    limit: string;

    isInvalid: boolean;

    constructor(
        private _cs: ClickhouseSerivce,
        // private _dtrs: DateTimeRangeService,
        private alertService: AlertService,
        public dialogAlarm: MatDialog,
public translateService: TranslateService,
        private cdr: ChangeDetectorRef,
        public dialogRef: MatDialogRef<SettingClickhouseChartWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.empty) {
            return;
        }
        try {
            this.timeRange = data.timeRange;
            this.chartType = data.chart.type.value;
            this.chartTitle = data.title;
            this.format = data.format.value;
            if (data.panel && data.panel.queries) {
                data.dataquery.data.map((v, k) => ({
                    panel_queries: Functions.cloneObject(data.panel.queries[k]),
                    dataquery: Functions.cloneObject(v)
                })).forEach(item => {
                    this.dataSource.push({
                        id: item.panel_queries.name,
                        panelDataSource: item.panel_queries.type.name,
                        database: item.panel_queries.database.name,
                        table: item.panel_queries.table.name,
                        buttons: true,
                        detail: {
                            timeColumn: item.dataquery.timeColumn || '',
                            resolution: item.dataquery.resolution || 60,
                            tags: item.dataquery.tags || [],
                            counter: item.dataquery.counter || [],
                            operator: item.dataquery.operator || 'count()',
                            raw: item.dataquery.raw || '',
                            autoMode: item.dataquery.autoMode,
                            limit: item.dataquery.limit || ''
                        }
                    });
                });
            }
            this.updateResult(true);
        } catch (err) {
            console.log(err);
            this.onNoClick();

            this.dialogAlarm.open(DialogAlarmComponent);

            console.warn('ERROR config broken');
        }
        // this.cdr.detectChanges();
    }
    onNoClick(): void {
        this.dialogRef.close();
        this.cdr.detectChanges();
    }

    addRecord() {
        if (this.panelDataSource && this.database && this.table) {
            let n = 1;
            const arr = this.dataSource.map(i => i.id);

            while (arr.indexOf('A' + n) !== -1) { n++; }

            const row: ClickhousePeriodicElement = {
                id: `A${n}`,
                panelDataSource: this.panelDataSource,
                database: this.database,
                table: this.table,
                buttons: true
            };

            this.dataSource.push(row);
            this.matTable.renderRows();
            this.updateResult();
        } else {
            this.alertService.error('error: need select all');
            setTimeout(this.alertService.hide.bind(this), 5000);
        }
        this.cdr.detectChanges();
    }

    async editRecord(element: any) {
        this.panelDataSource = element.panelDataSource;
        this.database = element.database;
        this.table = element.table;
        this.onPanelDatasource();
        this.onDatabase();
        this.onTable();
        this.showDetail();
        const id = element.id;
        this.selectedEditQuery = this.dataSource.find(item => item.id === id);
        if (!this.selectedEditQuery.detail) {
            this.selectedEditQuery.detail = {
                timeColumn: '',
                resolution: 60,
                counter: '',
                tags: [],
                operator: 'count()',
                raw: '',
                autoMode: true,
                limit: ''
            };
        } else {
            this.timeColumn = this.selectedEditQuery.detail.timeColumn;
            this.resolution = this.selectedEditQuery.detail.resolution,
            this.tags.setValue(this.selectedEditQuery.detail.tags);
            this.counter = this.selectedEditQuery.detail.counter;
            this.operator = this.selectedEditQuery.detail.operator;
            this.apiQueryValue = this.selectedEditQuery.detail.raw || '';
            this.autoMode = this.selectedEditQuery.detail.autoMode;
            this.limit = this.selectedEditQuery.detail.limit;
            if (this.apiQueryValue !== '') {
                this.rawBuffer = this.apiQueryValue;
            }
            this.updateRaw();
        }

        this.cdr.detectChanges();
    }

    deleteRecord(id: any) {
        this.dataSource = this.dataSource.filter(item => item.id !== id);
        this.matTable.renderRows();
        this.updateResult();
        this.cdr.detectChanges();
    }

    showDetail() {
        this.detailShow = true;
        this.cdr.detectChanges();
    }

    async onPanelDatasource() {
        const res = await this._cs.getClickhouseDbList().toPromise();
        if (res && res.data) {
            const [property] = Object.keys(res.data);
            this.databaseList = res.data[property];
            this.updateResult();
        }
        this.cdr.detectChanges();
    }

    async onDatabase() {
        const res = await this._cs.getClickhouseTableList(this.database).toPromise();
        if (res && res.data) {
            const [property] = Object.keys(res.data);
            this.tableList = res.data[property];
            this.updateResult();
        }
        this.cdr.detectChanges();
    }
    async onTable() {
        const columnRes = await this._cs.getClickhouseColumnList(this.database, this.table).toPromise();
        if (columnRes && columnRes.data) {
            const [property] = Object.keys(columnRes.data);
            this.timeColumnList = columnRes.data[property].filter(column => column.type === 'DateTime' || column.type === 'DateTime64');
            const counterRegexp = RegExp(/U?INT(8|16|32)|Float(32|64)/, 'i');
            this.counterList = columnRes.data[property].filter(column => counterRegexp.test(column.type));
            this.tagsList = columnRes.data[property].filter(column => column.type === 'String');
            this.updateResult();
            this.cdr.detectChanges();
        }
    }


    onDetails(tag: string, value: any = null) {
        if (tag) {
            this.selectedEditQuery.detail[tag] = value || value === '' ? value : this[tag].value;
        }
        this.updateCss(tag);
        this.updateResult();
        this.updateRaw();
    }
    onTimeColumn() {
        this.selectedEditQuery.detail.timeColumn = this.timeColumn;
        this.updateRaw();
    }
    onOperator() {
        this.selectedEditQuery.detail.operator = this.operator;
        this.updateRaw();
    }
    onCounter() {
        this.selectedEditQuery.detail.counter = this.counter;
        this.updateRaw();
    }
    onLimit() {
        this.selectedEditQuery.detail.limit = this.limit;
        this.updateRaw();
    }
    onResolution() {
        if (this.autoMode) {
            const timeDiff = this.timeRange.to - this.timeRange.from;

            if (timeDiff < 60) { // under 1 minute
                this.resolution = 1; // 1 second resolution
            } else if (timeDiff < 3600) { // under 1 hour
                this.resolution = 60; // 1 minute resolution
            } else if (timeDiff < 86400) { // under 1 day
                this.resolution = 3600; // 1 hour resolution
            } else if (timeDiff < 604800) { // under 1 week
                this.resolution = 21600; // 6 hours resolution
            } else {
                this.resolution = 86400; // 1 day resolution
            }
            this.selectedEditQuery.detail.autoMode = this.autoMode;
            this.selectedEditQuery.detail.resolution = this.resolution;
        } else {
            this.selectedEditQuery.detail.autoMode = this.autoMode;
            this.selectedEditQuery.detail.resolution = this.resolution;
        }
        this.updateRaw();
    }
    updateRaw() {
        if (this.selectedEditQuery.detail.raw === '') {
            const item = this.selectedEditQuery.detail;
            let operator = item.operator;

            if (item.counter) {
                operator = item.operator.replace('()', `(${item.counter})`);
            }
            this.rawBuffer = `SELECT
            (intDiv(toUInt32(${item.timeColumn}), ${item.resolution ? item.resolution : '60'}) * ${item.resolution ? item.resolution : '60'}) * 1000 as t,
            ${item.tags}${item.tags.length > 0 ? ',' : ''}
            ${operator}
            FROM ${this.database}.${this.table}
            WHERE ${item.timeColumn} BETWEEN toDateTime(${this.timeRange.from}) AND toDateTime(${this.timeRange.to})
            GROUP BY t${item.tags.length > 0 ? ',' : ''} ${item.tags}
            ORDER BY t
            ${item.limit !== '' && item.limit !== null && typeof item.limit !== 'undefined' ? 'LIMIT' + item.limit : ''}
            `;
        }
    }
    loadRaw(event) {
        if (event.tab.textLabel === 'Query') {
            this.apiQueryValue = this.rawBuffer;
        }
    }
    updateCss(tag: string) {
        setTimeout(() => {
            const _selector: HTMLElement = document.querySelector(`.chips-container-selector.${tag}`);
            const _chipList: HTMLElement = document.querySelector(`.chips-container.${tag}`);
            if (_chipList && _selector) {
                _selector.style.height = _chipList.offsetHeight + 'px';
                this.cdr.detectChanges();
            }
        });
    }
    updateResult(firstBoot: boolean = false, event: any = false) {
        if (event || event === '') {
            this.validate(event);
        }
        if (this.selectedEditQuery) {
            this.dataSource[this.dataSource.map(i => i.id).indexOf(this.selectedEditQuery.id)] = this.selectedEditQuery;
        }
        this.outputObject.chartType = this.chartType;
        this.outputObject.chartTitle = this.chartTitle;
        this.outputObject.format = this.format;
        this.outputObject.panelDataSource = this.panelDataSource;
        this.outputObject.dataSource = this.dataSource;
        if (!firstBoot) {
            this.cdr.detectChanges();
        }
    }

    /** chips */
    remove(item: any, typeName: string) {
        const arr = this[typeName].value;
        const index = arr.indexOf(item);
        this.updateCss(typeName);
        if (index >= 0) {
            arr.splice(index, 1);
            this[typeName].setValue(arr);
        }
    }
    validate(event) {
        event = event.trim();
        if (event === '' || event === ' ') {
            this.isInvalid = true;
        } else {
            this.isInvalid = false;
        }
    }
}
