import { Component, Inject, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { StatisticService } from '../../../services/statistic.service';
import { ChartType } from 'chart.js';
import { AlertService } from '../../../services/alert.service';
import { DateTimeRangeService } from '../../../services/data-time-range.service';
import { Functions } from '@app/helpers/functions';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { TranslateService } from '@ngx-translate/core'

export interface PeriodicElement {
    id: string;
    panelDataSource: string;
    database: string;
    retentionPolicy: string;
    buttons: boolean;
    detail?: {
        measurement?: string;
        counter?: Array<string>;
        tags?: Array<string>;
        values?: Array<string>;
        sum?: boolean;
        raw?: string;
    };
}

export interface SelectList {
    name: string;
    title?: string;
    uid?: string;
    id?: number;
    uri?: string;
    url?: string;
    type?: string;
    isStarred?: boolean;
    tags?: Array<any>;
    value: string;
}
export interface GroupedSelectList {
    group: string;
    list: SelectList[];
}

@Component({
    selector: 'app-setting-influxdbchart-widget-component',
    templateUrl: 'setting-influxdbchart-widget.component.html',
    styleUrls: ['./setting-influxdbchart-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingInfluxdbchartWidgetComponent {
    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    displayedColumns: string[] = ['id', 'panelDataSource', 'database', 'retentionPolicy', 'buttons'];
    dataSource: PeriodicElement[] = [];
    detailShow = false;

    chartTypeList = [
        'line', 'bar', 'horizontalBar', 'radar',
        'doughnut', 'polarArea', 'area', 'pie'
    ];

    databaseList: SelectList[] = [];
    retentionPolicyList: SelectList[] = [];
    measurementList: SelectList[] = [];
    counterList: SelectList[] = [];
    tagsList: SelectList[] = [];

    chartTitle: string;
    chartType: string;
    format: string;

    panelDataSource: string;
    database: string;
    retentionPolicy: string;

    measurement: string;
    counter = new FormControl();
    tags = new FormControl();
    values = new FormControl();
    isSum: boolean;
    selectedEditQuery: PeriodicElement;

    // apiQueryPath: string;
    apiQueryValue: string;
    curlDebug: string;
    curlResponse: string;

    outputObject: any = {};

    isInvalid: boolean;

    constructor(
        private _ss: StatisticService,
        private _dtrs: DateTimeRangeService,
        private alertService: AlertService,
        public translateService: TranslateService,
        public dialogAlarm: MatDialog,
        public dialogRef: MatDialogRef<SettingInfluxdbchartWidgetComponent>,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.empty) {
            return;
        }
        try {
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
                        retentionPolicy: item.panel_queries.retention.name,
                        buttons: true,
                        detail: {
                            measurement: item.dataquery.main.name,
                            counter: item.dataquery.type.map(i => i.name),
                            tags: item.dataquery.tag.map(i => i.name),
                            values: [],
                            sum: item.dataquery.sum,
                            raw: item.dataquery.raw || ''
                        }
                    });
                });
            }
            this.updateResult(true);
        } catch (err) {
            this.onNoClick();

            this.dialogAlarm.open(DialogAlarmComponent);

            console.warn('ERROR config broken');
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    addRecord() {
        if (this.panelDataSource && this.database && this.retentionPolicy) {
            let n = 1;
            const arr = this.dataSource.map(i => i.id);

            while (arr.indexOf('A' + n) !== -1) { n++; }

            const row: PeriodicElement = {
                id: `A${n}`,
                panelDataSource: this.panelDataSource,
                database: this.database,
                retentionPolicy: this.retentionPolicy,
                buttons: true
            };

            this.dataSource.push(row);
            this.table.renderRows();
            this.updateResult();
        } else {
            this.alertService.error('error: need select all');
            setTimeout(this.alertService.hide.bind(this), 5000);
        }
        this.cdr.detectChanges();
    }

    async editRecord(element: any) {
        this.showDetail();
        const id = element.id;
        this.selectedEditQuery = this.dataSource.find(item => item.id === id);
        if (!this.selectedEditQuery.detail) {
            this.selectedEditQuery.detail = {
                measurement: '',
                counter: [],
                sum: false,
                tags: [],
                values: [],
                raw: ''
            };
        } else {
            this.measurement = this.selectedEditQuery.detail.measurement;
            this.isSum = this.selectedEditQuery.detail.sum;
            this.onMeasurement();
            this.values.setValue(this.selectedEditQuery.detail.values);
            this.apiQueryValue = this.selectedEditQuery.detail.raw || '';
        }
        this.cdr.detectChanges();
        const res = await this._ss.getStatisticMeasurements(this.selectedEditQuery.database).toPromise();

        if (res && res.data) {
            this.measurementList = res.data.Results[0].Series[0].values.map(i => ({ name: i[0], value: i[0] }));
        }
        this.cdr.detectChanges();
    }

    deleteRecord(id: any) {
        this.dataSource = this.dataSource.filter(item => item.id !== id);
        this.table.renderRows();
        this.updateResult();
        this.cdr.detectChanges();
    }

    showDetail() {
        this.detailShow = true;
    }

    async onPanelDatasource() {
        const res = await this._ss.getStatisticDbList().toPromise();
        if (res && res.data) {
            this.databaseList = res.data.Results[0].Series[0].values.map(i => ({ name: i[0], value: i[0] }));
            this.updateResult();
            this.cdr.detectChanges();
        }
    }

    async onDatabase() {
        const reqData = {
            timestamp: this._dtrs.getDatesForQuery(),
            param: {
                search: {
                    database: this.database
                },
                limit: 100,
                total: false
            }
        };
        const res = await this._ss.getStatisticRetentions(reqData).toPromise();
        if (res && res.data) {
            this.retentionPolicyList = res.data.Results[0].Series[0].values.map(i => ({ name: i[0], value: i[0] }));
            this.retentionPolicyList.push({ name: 'none', value: 'none' });

            this.updateResult();
            this.cdr.detectChanges();
        }
    }


    async onMeasurement() {
        const res = await this._ss.getStatisticMetrics({
            timestamp: this._dtrs.getDatesForQuery(),
            param: {
                search: {},
                limit: 100,
                total: true,
                query: [{
                    main: this.measurement,
                    database: this.selectedEditQuery.database,
                    retention: this.selectedEditQuery.retentionPolicy
                }]
            }
        }).toPromise();
        if (res && res.data) {
            this.counterList = res.data.Results[0].Series[0].values.map(i => ({ name: i[0], value: i[0] }));
            this.counter.setValue(this.selectedEditQuery.detail.counter);
            this.selectedEditQuery.detail.measurement = this.measurement;
        }

        const res2 = await this._ss.getStatisticTags({
            timestamp: this._dtrs.getDatesForQuery(),
            param: {
                search: {},
                limit: 100,
                total: true,
                query: [{
                    main: this.measurement,
                    database: this.selectedEditQuery.database,
                    retention: this.selectedEditQuery.retentionPolicy
                }]
            }
        }).toPromise();

        if (res2 && res2.data) {
            this.tagsList = res2.data.Results[0].Series[0].values.map(i => ({ name: i[0], value: i[0] }));
            this.tags.setValue(this.selectedEditQuery.detail.tags);
        }
        this.updateCss('counter');
        this.updateCss('tags');

        this.updateResult();
        this.cdr.detectChanges();
    }
    onDetails(tag: string, value: any = null) {
        if (tag) {
            this.selectedEditQuery.detail[tag] = value ? value : this[tag].value;
        }
        this.updateCss(tag);
        this.updateResult();
        this.cdr.detectChanges();
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
    updateResult(firstBoot: boolean = false) {
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
            this.cdr.detectChanges();
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
