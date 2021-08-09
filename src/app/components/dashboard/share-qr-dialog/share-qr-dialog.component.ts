import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlertService, DashboardService, } from '@app/services';
import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'app-share-qr-dialog',
    templateUrl: './share-qr-dialog.component.html',
    styleUrls: ['./share-qr-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShareQrDialogComponent {
    dashboardLink;
    dashboardId;
    elementType;
    correctionLevel;
    value;
    id;
    shared;
    params;
    constructor(
        public dialogRef: MatDialogRef<ShareQrDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data,
        public dashboardService: DashboardService,
        public cdr: ChangeDetectorRef,
        public alertService: AlertService,
        public translateService: TranslateService

    ) {

        this.dashboardId = dashboardService.getCurrentDashBoardId();

        dashboardService.getDashboardInfo()
            .toPromise()
            .then((data) => {

                this.dashboardLink = this.getDashboardData(
                    this.dashboardId, data);

            });
        this.shared = data.shared;
        this.id = data.id;
        this.elementType = data.qrElementType;
        this.correctionLevel = data.qrCorrectionLevel;
        this.value = window.location.href;


    }

    getDashboardData(id, arr) {
        return arr.data.filter((f) => f.id === id);
    }
    copyLink(qrlink) {
        qrlink.select();
        document.execCommand('copy');
        qrlink.setSelectionRange(0, 0);
        this.translateService.get('notifications.success.linkCopy').subscribe(res => { 
            this.alertService.success(res);   
        })
    }
    shareDashboard() {

        let actualDb: any;
        this.dashboardService.getDashboardStore(this.id).toPromise().then(dbData => {
            actualDb = dbData?.data;
            if (actualDb) {
                actualDb.shared = true;
                this.dashboardService.updateDashboard(actualDb);
                this.shared = true;
                this.onShareDashboard(this.shared);
                this.translateService.get('notifications.success.dashboardShared').subscribe(res => { 
                    this.alertService.success(res);   
                })
                this.cdr.detectChanges();
            }
        });
    }
    onShareDashboard(data) {
        this.params.shareDashboard(data);
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
