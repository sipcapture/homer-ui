import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-url-warning-dialog',
    templateUrl: './url-warning-dialog.component.html',
    styleUrls: ['./url-warning-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UrlWarningDialog {

    constructor(
        public dialogRef: MatDialogRef<UrlWarningDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}


