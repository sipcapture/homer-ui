import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions, setStorage } from '@app/helpers/functions';
import { UserConstValue } from '../../../models/const-value.model';
import { TranslateService } from '@ngx-translate/core'
export interface DialogData {
    apicol: any;
    apipoint: any;
    columns: any;
    idParent?: string;
    agGridSizeControl?: any;
    protocol_id?: string;
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
    protocol_id;
    public radioSizeType = [
        {
            type: 'sizeToFit',
            title: 'Size To Fit Columns on Load',
        },
        {
            type: 'sizeToFitContinuos',
            title: 'Size To Fit Columns',
        },
        {
            type: 'sizeColumnsToFit',
            title: 'Size To Fit Content',
        },
        {
            type: 'none',
            title: 'Manual sizing',
        }
    ];
    selectedType: string;
    agGridSizeControl: any = {};
    allColumnIds: Array<any> = [];
    _bufferData: Array<any>;
    constructor(
        public dialogRef: MatDialogRef<DialogSettingsGridDialog>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.apiColumn = data.apicol;
        this.apiPoint = data.apipoint;
        this.protocol_id = data.protocol_id;
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
    onUpdateProto({ event: { container } }: any) {
        if (this.apiColumn.getAllColumns()) {
            const activeListView = container.id === 'activeListView' ? container : null;
            const inactiveListView = container.id === 'inactiveListView' ? container : null;
            const columnState = this.apiColumn.getColumnState();
            const setVisible = (fName, bool) => {
                if (columnState.find(({ colId }) => colId === fName)?.hide === bool) {
                    this.apiColumn.setColumnVisible(fName, bool);
                }
            };
            inactiveListView?.data.forEach(({ field, selected }) => setVisible(field, selected));
            activeListView?.data.forEach(({ field, selected }, key) => {
                setVisible(field, selected);
                this.apiColumn.moveColumn(field, key + 1);
            });

            const id = (this.id ? `-${this.id}` : '') + `-${this.protocol_id}`;
            const lsIndexUser = UserConstValue.RESULT_STATE + id;
            setStorage(lsIndexUser, this.apiColumn.getColumnState());

            setTimeout(() => Functions.emitWindowResize(), 100);
        }
    }

    onChangeSizeToFit(event, type?) {
        this.agGridSizeControl[type] = event;
        // console.log(event, type);
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

