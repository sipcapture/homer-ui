import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import * as moment from 'moment';

export interface ExportData {
    apicol: any;
    apipoint: any;
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
        @Inject(MAT_DIALOG_DATA) public data: ExportData
    ) {

        this.apiColumn = data.apicol;
        this.apiPoint = data.apipoint;
        this.id = data.idParent;
        this.protocol = data.protocol;
        if (typeof this.apiColumn.getAllColumns() !== 'undefined' && this.apiColumn.getAllColumns() !== null) {
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
        if (typeof this.apiColumn.getAllColumns() !== 'undefined' && this.apiColumn.getAllColumns() !== null) {
            this.params.gridExport.columnKeys = this._bufferData.map(item => item.field);
        }
        this.filename = `hep_proto_${this.protocol}_${moment().format('YYYY-MM-DD')}`;
        this.params.gridExport.fileName = this.filename;
        this.cdr.detectChanges();
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
        } else if (param.column.colId === 'mos') {
            return param.value / 100;
        } else if (param.column.colId === 'duration') {
            return Functions.secondsToHour(param.value || 0);
        } else {
            return param.value;
        }

    }
    export() {
        this.apiPoint.exportDataAsCsv(this.params.gridExport);
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
