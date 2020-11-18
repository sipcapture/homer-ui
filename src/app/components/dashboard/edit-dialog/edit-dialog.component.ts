import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DashboardService } from '@app/services';

export interface DashboardConfig {
    name: string;
    type: number;
    gridType: string;
    param: string;
    shared: boolean;
    columns: number;
    maxrows: number;
    pushing: boolean;
    ignoreMinSize: string;
    grafanaTimestamp: boolean;
}

@Component({
    selector: 'app-edit-dialog',
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent {
    typeList = [];
    typeBoolean = {
        CUSTOM: true,
        FRAME: true,
        HOME: true,
        SEARCH: true,
        ALARM: true
    };
    isHomeOrSearch = false;
    isSEARCH = false;
    ignoreMinSizeList: { [key: string]: string } = {
        /*'Limit': 'limit', */
        'Warning': 'warning',
        'Ignore': 'Ignore'
    };
    callBackExport: Function = null;

    constructor(
        public dialogRef: MatDialogRef<EditDialogComponent>,
        private _ds: DashboardService,
        @Inject(MAT_DIALOG_DATA) public data: DashboardConfig
    ) {
        this.isSEARCH = this._ds.getCurrentDashBoardId() === 'search';
        this.isHomeOrSearch = this.isSEARCH || this._ds.getCurrentDashBoardId() === 'home';

        this._ds.getDashboardInfo().toPromise().then((list: any) => {
            if ( list && list.data && list.data.length > 0) {
                this.typeBoolean.HOME = list.data.filter(i => i.id === 'home').length === 0;

                if (!this.isSEARCH) {
                    this.typeBoolean.SEARCH = list.data.filter(i => i.id === 'search').length === 0;
                }
            }

            this.typeList = Object.keys(this.typeBoolean).map((v, k) => ({
                index: k + 1,
                name: v,
                disabled: !this.typeBoolean[v]
            }));
        });
    }
    onExport() {
        if ( this.callBackExport !== null) {
            this.callBackExport();
        }
    }
    export(cb: Function) {
        this.callBackExport = cb;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
