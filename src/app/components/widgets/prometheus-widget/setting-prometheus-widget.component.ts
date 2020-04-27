import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { AlertService } from '@app/services/alert.service';
import { Functions } from '@app/helpers/functions';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { PrometheusService } from '@app/services/prometheus.service';

@Component({
    selector: 'app-setting-prometheus-widget-component',
    templateUrl: 'setting-prometheus-widget.component.html',
    styleUrls: ['./setting-prometheus-widget.component.scss']
})

export class SettingPrometheusWidgetComponent {
    @ViewChild(MatTable, {static: true}) table: MatTable<any>;

    public metricList: string[] = [];
    public _metricList: string[];

    public prometheusLabelList: string[];
    public prometheusLabel: string;
    public prometheusQuery: string;

    public displayedColumns: string[] = ['id', 'panelDataSource', 'buttons'];
    public dataSource: any[] = [];
    public detailShow = false;

    public chartTypeList = [
        'line', 'bar', 'horizontalBar', 'radar',
        'doughnut', 'polarArea', 'area', 'pie'
    ];

    public chartTitle: string;
    public chartType: string;
    public format: string;

    private panelDataSource = 'prometheus';

    private values = new FormControl();
    public prometheus = new FormControl();
    public isSum: boolean;
    private selecedEditQuery: any;

    private apiQueryValue: string;

    outputObject: any = {};

    constructor(
        private _ps: PrometheusService,
        private alertService: AlertService,
        public dialogAlarm: MatDialog,
        public dialogRef: MatDialogRef<SettingPrometheusWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
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
                        this.prometheusQuery = item.dataquery.prometheusQuries;
                        this.dataSource.push({
                            id: item.panel_queries.name,
                            panelDataSource: item.panel_queries.type.name,
                            buttons: true,
                            detail: {
                                prometheusLabels: item.dataquery.prometheusLabels,
                                prometheusQuries: item.dataquery.prometheusQuries,
                                sum: item.dataquery.sum
                            }
                        });
                    });
                }

                this.updateResult();
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
        if (this.panelDataSource ) {
            let n = 1;
            const arr = this.dataSource.map(i => i.id);

            while (arr.indexOf('A' + n) !== -1) { n++; }

            const row: any = {
                id: `A${n}`,
                panelDataSource: this.panelDataSource,
                buttons: true
            };

            this.dataSource.push(row);
            this.table.renderRows();
            this.updateResult();
        } else {
            this.alertService.error('error: need select all');
            setTimeout(() => {
                this.alertService.hide();
            }, 5000);
        }
    }

    editRecord(element: any) {
        const id = element.id;
        this.selecedEditQuery = this.dataSource.filter(item => item.id === id)[0];
        if (!this.selecedEditQuery.detail) {
            this.selecedEditQuery.detail = {
                prometheusLabels: [],
                prometheusQuries: '',
                sum: false,
            };
        } else {
            this.isSum = this.selecedEditQuery.detail.sum;
            this.values.setValue(this.selecedEditQuery.detail.values);
        }
        /**
         * PROMRTHEUS SERVICE LABEL
         */

        this.showDetail();
        this._ps.getLabel().subscribe(data => {
            if (!data) {
                return;
            }
            this.prometheusLabelList = data as Array<string>;

            this.prometheus.setValue(this.selecedEditQuery.detail.prometheusLabels as Array<string>);
            this.updateCss('prometheus');
            this.updateResult();
        });
        const _prometheusLabels = Functions.cloneObject(this.selecedEditQuery.detail.prometheusLabels);
        this.getMetrics(_prometheusLabels, data => {
            this.metricList = data;
            this._metricList = Functions.cloneObject(this.metricList);
            this.updateFilters();
        });
    }

    getMetrics(arrLabels: string[], callback: Function, result = []) {
        if (arrLabels.length > 0) {
            this._ps.getLabels(arrLabels.shift()).subscribe(metrics => {
                metrics = metrics.map(i => {
                    let name = i.__name__;
                    name += '{' + Object.keys(i).filter(j => j !== '__name__').map(j => `${j}="${i[j]}"`).join(',') + '}';
                    return name;
                });
                result = result.concat(metrics);
                this.getMetrics(arrLabels, callback, result);
            });
            return;
        }
        callback(result);
    }

    deleteRecord(id: any) {
        this.dataSource = this.dataSource.filter(item => item.id !== id);
        this.table.renderRows();
        this.updateResult();
    }

    showDetail() {
        this.detailShow = true;
    }
    updateFilters() {
        const arrStr = this.prometheusQuery.replace(/[\{\}\s]{1}/g, '').split(',');
        arrStr.forEach(j => {
            this._metricList = Functions.cloneObject(this.metricList.filter(i => i.indexOf(j) !== -1));
        });
    }
    onChartType() {
        this.updateResult();
    }

    onPrometheusLabel () {
        this.selecedEditQuery.detail.prometheusLabels = this.prometheus.value;
        const _prometheusLabels = Functions.cloneObject(this.selecedEditQuery.detail.prometheusLabels);
        this.getMetrics(_prometheusLabels, data => {
            this.metricList = data;
            this._metricList = Functions.cloneObject(this.metricList);
            this.prometheusQuery = '';
            this.updateFilters();
        });
        this.updateResult();
    }
    onPrometheusQuery (event = null) {
        this.prometheusQuery = event.text;
        const arrStr = this.prometheusQuery.replace(/[\{\}\s]{1}/g, '').split(',');
        arrStr.forEach(j => {
            this._metricList = Functions.cloneObject(this.metricList.filter(i => i.indexOf(j) !== -1));
        });

        this.selecedEditQuery.detail.prometheusQuries = this.prometheusQuery;
        this.updateCss('prometheus');
        this.updateResult();
    }
    onSum() {
        this.selecedEditQuery.detail.sum = this.isSum;
        this.updateResult();
    }
    onFormat () {
        this.updateResult();
    }

    onRawValue () {
        this.selecedEditQuery.detail.raw = this.apiQueryValue;
        this.updateResult();
    }
    updateCss(tag: string) {
        setTimeout(() => {
            const _selector: HTMLElement = document.querySelector(`.chips-container-selector.${tag}`);
            const _chipList: HTMLElement = document.querySelector(`.chips-container.${tag}`);
            if (_chipList && _selector) {
                _selector.style.height = _chipList.offsetHeight + 'px';
            }
        });
    }
    private updateResult () {
        if (this.selecedEditQuery) {
            this.dataSource[this.dataSource.map(i => i.id).indexOf(this.selecedEditQuery.id)] = this.selecedEditQuery;
        }
        this.outputObject.chartType = this.chartType;
        this.outputObject.chartTitle = this.chartTitle;
        this.outputObject.format = this.format;
        this.outputObject.panelDataSource = this.panelDataSource;
        this.outputObject.dataSource = this.dataSource;
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
}
