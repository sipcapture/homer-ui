import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';

export interface DialogData {
    apicol: any;
    apipoint: any;
    columns: any;
    idParent?: string;
}

@Component({
    selector: 'app-grid-setting-dialog',
    templateUrl: 'grid-settings-dialog.html',
    styleUrls: ['./grid-settings-dialog.css']
})
export class DialogSettingsGridDialog {

    public apiColumn: any;
    apiPoint: any;
    id: string;

    allColumnIds: Array<any> = [];
    _bufferData: Array<any>;
    constructor(
        public dialogRef: MatDialogRef<DialogSettingsGridDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.apiColumn = data.apicol;
        this.apiPoint = data.apipoint;
        this.id = data.idParent;

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
            .map(i => JSON.parse(i));

        this._bufferData = Functions.cloneObject(this.allColumnIds);
    }
    onUpdateProto(event) {
        const objField = event.filter(i => {
            const k = this._bufferData.filter(j => i.name === j.name)[0];
            return i.selected !== k.selected;
        })[0];

        this.onChange(objField && objField.selected, objField && objField.field);

        this._bufferData = Functions.cloneObject(this.allColumnIds);
        let lsIndex = 'result-state';
        if ( this.id ) {
            lsIndex += `-${this.id}`;
        }
        localStorage.setItem(lsIndex, JSON.stringify(this._bufferData));
    }
    onChange(event: boolean, field: string): void {
        this.apiColumn.setColumnVisible(field, event);
        this.apiPoint.sizeColumnsToFit();
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

