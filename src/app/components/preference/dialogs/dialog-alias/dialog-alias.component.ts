import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-alias',
    templateUrl: './dialog-alias.component.html',
    styleUrls: ['./dialog-alias.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAliasComponent {
    @ViewChild('data_view', { static: false }) editor;
    isDisabled = false;
    constructor(
        public dialogRef: MatDialogRef<DialogAliasComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                alias: 'localhost',
                ip: '127.0.0.1',
                port: 5060,
                mask: 32,
                captureID: 'CAP101',
                status: false,
            };
        }

        data.data.captureID = data.isnew ?
            'CAP101' :
            (typeof data.data.captureID === 'number' ?
                data.data.captureID : String(data.data.captureID)
            );

    }

    validate() {
        if (this.editor.getEditor().getSession().getAnnotations().length > 0) {
            this.isDisabled = true;
        } else {
            this.isDisabled = false;
        }
    }

    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }

}
