import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { ConstValue } from '../../../models/const-value.model';

export interface DialogData {
    apicol: any;
    apipoint: any;
    columns: any;
    idParent?: string;
    agGridSizeControl?: any;
}

@Component({
    selector: 'app-grid-setting-dialog',
    templateUrl: 'grid-settings-dialog.html',
    styleUrls: ['./grid-settings-dialog.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogSettingsGridDialog {
    public apiColumn: any;
    apiPoint: any;
    id: string;
    public checkboxSizeType = [
        {
            type: 'sizeToFit',
            title: 'Size To Fit',
            selected: false,
        },
        {
            type: 'sizeColumnsToFit',
            title: 'Size Columns To Fit',
            selected: false,
        }
    ];
    agGridSizeControl: any = {};
    allColumnIds: Array<any> = [];
    _bufferData: Array<any>;
    constructor(
        public dialogRef: MatDialogRef<DialogSettingsGridDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.agGridSizeControl = data.agGridSizeControl;
        this.checkboxSizeType.forEach((i) => {
            i.selected = this.agGridSizeControl[i.type];
        });

        this.apiColumn = data.apicol;
        this.apiPoint = data.apipoint;

        this.id = data.idParent;
        if (
            typeof this.apiColumn.getAllColumns() !== 'undefined' &&
            this.apiColumn.getAllColumns() !== null
        ) {
            Object.values(this.apiColumn.getAllGridColumns() as Object)
                .filter((column) => !['', 'id'].includes(column.colDef.field))
                .forEach((column, index) =>
                    this.allColumnIds.push({
                        name: column.colDef.headerName,
                        field: column.colDef.field,
                        selected: column.visible,
                        idx: index
                    })
                );
            this.allColumnIds = this.allColumnIds
                .map((i) => JSON.stringify(i))
                .filter((i, k, arr) => i !== arr[k - 1])
                .map((i) => JSON.parse(i))
                .sort((a, b) => a.idx - b.idx);

            this._bufferData = Functions.cloneObject(this.allColumnIds);
        }
    }
    onUpdateProto(event) {
        const moved = event.event;
        if (
            typeof this.apiColumn.getAllColumns() !== 'undefined' &&
            this.apiColumn.getAllColumns() !== null
        ) {
            const objField = event.newProto.find((item, index) => {
                const k = this._bufferData.find((j) => item.name === j.name);
                return item.selected !== k.selected;
            });
            const currentField = event.newProto.filter(item => item.selected === true).find((item, index) => moved.item.element.nativeElement.innerText  === item.name );
            let modifier = 1;
            if (moved.currentIndex < moved.previousIndex) {
                modifier = -1;
            }
            const previousFieldIndex = moved.container.data.findIndex(item => JSON.stringify(item) === JSON.stringify(currentField)) - modifier;
            const previousField = moved.container.data.find((item, index) => index === previousFieldIndex);
            this._bufferData = Functions.cloneObject(this.allColumnIds);
            let bufferIndex = -1;
            if (event.event.container.id === 'cdk-drop-list-1') {
                this._bufferData.forEach((item,index) => {
                    if(typeof previousField !== 'undefined' && item.name === previousField.name) {
                        bufferIndex = index;
                    }  else if (typeof previousField === 'undefined') {
                        bufferIndex = 0;
                    }
                })
            }
            this.onChange(objField && objField.selected, objField && objField.field, {
                field: currentField,
                index: bufferIndex}, Functions.cloneObject(this._bufferData));
            let lsIndex = 'result-state';
            if (this.id) {
                lsIndex += `-${this.id}`;
            }
            localStorage.setItem(lsIndex, JSON.stringify(this._bufferData));
        }
    }
    onChange(event: boolean, field: string, moved: any, test): void {
        if (moved.index !== -1) {
            moved.index++;
            this.apiColumn.moveColumn(moved.field.field, moved.index);
        }
        this.apiColumn.setColumnVisible(field, event);
        if (this.agGridSizeControl.sizeColumnsToFit) {
            this.apiPoint.sizeColumnsToFit();
        }
        this.getNewColumns();
    }
    getNewColumns() {
        this.allColumnIds = []
        if (
            typeof this.apiColumn.getAllColumns() !== 'undefined' &&
            this.apiColumn.getAllColumns() !== null
        ) {
            Object.values(this.apiColumn.getAllGridColumns() as Object)
                .filter((column) => !['', 'id'].includes(column.colDef.field))
                .forEach((column, index) =>
                    this.allColumnIds.push({
                        name: column.colDef.headerName,
                        field: column.colDef.field,
                        selected: column.visible,
                        idx: index
                    })
                );
            this.allColumnIds = this.allColumnIds
                .map((i) => JSON.stringify(i))
                .filter((i, k, arr) => i !== arr[k - 1])
                .map((i) => JSON.parse(i))
                .sort((a, b) => a.idx - b.idx);

            this._bufferData = Functions.cloneObject(this.allColumnIds);
        }
    }
    onChangeSizeToFit(event, type?) {
        this.agGridSizeControl[type] = event;

        if (this.agGridSizeControl.sizeToFit) {
            this.apiPoint.sizeColumnsToFit();
        }
        if (this.agGridSizeControl.sizeColumnsToFit) {
            this.autoSizeAll(true);
        }
    }
    private autoSizeAll(skipHeader) {
        const allColumnIds = [];
        this.apiColumn.getAllColumns().forEach(function (column) {
            allColumnIds.push(column.colId);
        });
        this.apiColumn.autoSizeColumns(allColumnIds, skipHeader);
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
