import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import * as XLSX from 'xlsx';
import  moment from 'moment';
import { TranslateService } from '@ngx-translate/core'
export interface ExportData {
    apicol: any;
    apipoint: any;
    mappings: any;
    columns: any;
    idParent?: string;
    protocol: string;
}

@Component({
    selector: 'app-export-dialog',
    templateUrl: 'export-dialog.component.html',
    styleUrls: ['./export-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ExportDialogComponent implements OnInit {
    public apiColumn: any;
    apiPoint: any;
    mappings: any;
    id: string;
    allColumnIds: Array<any> = [];
    _bufferData: Array<any>;
    exportColumns: Array<string> = [];
    protocol: string;
    filename = '';
    params = {
        type: 'CSV',
        isFormatted: true,
        convertStatus: true,
        gridExport: {
            fileName: this.filename,
            onlySelectedAllPages: false,
            columnKeys: this.exportColumns,
            allColumns: false,
            processCellCallback: (param) => this.formatData(param)
        }
    };
    constructor(
        public dialogRef: MatDialogRef<ExportDialogComponent>,
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: ExportData
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.apiColumn = data.apicol;
        this.apiPoint = data.apipoint;
        this.mappings = data.mappings;
        this.id = data.idParent;
        this.protocol = data.protocol;
        if (typeof this.apiColumn?.getAllColumns() !== 'undefined' && this.apiColumn.getAllColumns() !== null) {
            Object.values(this.apiColumn.getAllColumns() as Object)
                .filter(column => !['', 'id'].includes(column.colDef.field))
                .forEach(column => this.allColumnIds.push({
                    name: column.colDef.headerName,
                    field: column.colDef.field,
                    selected: column.visible
                }));
            this.allColumnIds = this.allColumnIds
                .map(i => JSON.stringify(i))
                .sort()
                .filter((i, k, arr) => i !== arr[k - 1])
                .map(i => Functions.JSON_parse(i));

            this._bufferData = Functions.cloneObject(this.allColumnIds);
        }
    }
    ngOnInit() {
        if (typeof this.apiColumn?.getAllColumns() !== 'undefined' && this.apiColumn.getAllColumns() !== null) {
            for (let i = 0; i < this._bufferData.length; i++) {
                if (this._bufferData[i].selected) {
                    this.exportColumns.push(this._bufferData[i].field);
                }
            }
            this.params.gridExport.columnKeys = this.exportColumns;
        }
        this.filename = `hep_proto_${this.protocol}_${moment().format('YYYY-MM-DD')}`;
        this.params.gridExport.fileName = this.filename;
        this.cdr.detectChanges();
    }
    onUpdateProto(event) {
        if (typeof this.apiColumn?.getAllColumns() !== 'undefined' && this.apiColumn.getAllColumns() !== null) {
            const objField = event.find(i => {
                const k = this._bufferData.find(j => i.name === j.name);
                return i.selected !== k.selected;
            });
            this._bufferData = Functions.cloneObject(this.allColumnIds);
            this.exportColumns = [];
            for (let i = 0; i < this._bufferData.length; i++) {
                if (this._bufferData[i].selected) {
                    this.exportColumns.push(this._bufferData[i].field);
                }
            }
            this.params.gridExport.columnKeys = this.exportColumns;
            this.cdr.detectChanges();
        }
    }
    formatData(param) {
        if (param.column.colId === 'create_date') {
            if (this.params.isFormatted) {
                const formattedValue = moment(param.value, 'x').format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
                return formattedValue;
            } else {
                const formattedValue = moment(param.value, 'x').format('X');
                return formattedValue;
            }
        } else if (param.column.colId === 'status' && this.params.convertStatus) {

            if (this.mappings) {
                const statusMap = this.mappings.find((f: any) => f.id === 'status');
                if (statusMap && statusMap['form_default']) {
                    return (statusMap['form_default'].find((f: any) => f.value === param.value))['name'];
                } else {
                    return param.value;
                }
            } else {
                return param.value;
            }
        } else if (param.column.colId === 'mos') {
            return param.value / 100;
        } else if (param.column.colId === 'duration') {
            return Functions.secondsToHour(param.value || 0);
        } else {
            return param.value;
        }

    }
    export() {
        if (this.params.type === 'CSV') {
            this.apiPoint.exportDataAsCsv(this.params.gridExport);
        } else if (this.params.type === 'XLSX') {
            const workbook = XLSX.read(this.apiPoint.getDataAsCsv(this.params.gridExport), { type: 'string' });
            XLSX.writeFile(workbook, `${this.filename}.xlsx`);
        }
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
