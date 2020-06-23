import { Component, Inject, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DashboardService } from '@app/services';

@Component({
    selector: 'app-add-dashboard-dialog',
    templateUrl: './add-dashboard-dialog.component.html',
    styleUrls: ['./add-dashboard-dialog.component.scss']
})
export class AddDashboardDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('fileSelect', {static: true}) fileSelect;

    idDrugOver = false;

    typeList = [];
    typeBoolean = {
        CUSTOM: true,
        FRAME: true,
        HOME: true,
        SEARCH: true,
        ALARM: true
    };
    constructor(
        public dialogRef: MatDialogRef<AddDashboardDialogComponent>,
        private _ds: DashboardService,
        @Inject(MAT_DIALOG_DATA) public data: any = {}
    ) {
        this._ds.getDashboardInfo().toPromise().then((list: any) => {
            if ( list && list.data && list.data.length > 0) {
                this.typeBoolean.HOME = list.data.filter(i => i.id === 'home').length === 0;
                this.typeBoolean.SEARCH = list.data.filter(i => i.id === 'search').length === 0;
            }

            this.typeList = Object.keys(this.typeBoolean).map((v, k) => ({
                index: k + 1,
                name: v
            })).filter(i => this.typeBoolean[i.name]);
        });
    }
    ngOnInit() {
    }

    ngAfterViewInit() {
        const hsp = e => {
            this.idDrugOver = e.type === 'dragover';
            e.preventDefault();
            e.stopPropagation();
        };
        const handlerDrop = e => {
            hsp(e);
            Array.from(e.dataTransfer.files).forEach(this.handlerUpload.bind(this));
        };
        const objEvents = {
            submit: hsp, drag: hsp, dragstart: hsp, dragend: hsp,
            dragover: hsp, dragenter: hsp, dragleave: hsp,
            drop: handlerDrop, change: e => this.handlerUpload(e.target.files[0])
        };
        Object.keys(objEvents).forEach(eventName => {
            this.fileSelect.nativeElement.addEventListener(eventName, objEvents[eventName]);
        });
    }
    private async handlerUpload (file: any) {
        if (!this.data) {
            this.data = {};
        }
        const text = await file.text();
        try {
            const dashboard = JSON.parse(text);

            this.data.nameNewPanel = dashboard.data.name;
            this.data.type = dashboard.data.type || 1;
            this.data.param = dashboard.data.param || '';
            this.data.dashboard = dashboard.data;
        } catch (e) {
            console.error('Invalid JSON file');
        }
    }
    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnDestroy() { }
}
