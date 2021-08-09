import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-agentsub',
    templateUrl: './dialog-agentsub.component.html',
    styleUrls: ['./dialog-agentsub.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class DialogAgentsubComponent {
    @ViewChild('data_view', { static: false }) editor;
    isDisabled = false;


    constructor(
        public dialogRef: MatDialogRef<DialogAgentsubComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {};
        }
        data.data.mapping = data.isnew ?
            '' :
            (typeof data.data.mapping === 'string' ?
                data.data.mapping :
                JSON.stringify(data.data.mapping, null, 4)
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
