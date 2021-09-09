import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'

@Component({
    selector: 'app-dialog-authtoken-display',
    templateUrl: './dialog-authtoken-display.component.html',
    styleUrls: ['./dialog-authtoken-display.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class DialogAuthTokenDisplayComponent {
    token: 'empty';
    isAdmin = false;
    constructor(
        private authService: AuthenticationService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogAuthTokenDisplayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.token = data.data.token;
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}


