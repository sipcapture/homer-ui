import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-agentsub',
    templateUrl: './dialog-agentsub.component.html',
    styleUrls: ['./dialog-agentsub.component.scss']
})
export class DialogAgentsubComponent {
    @ViewChild('data_view', {static: false}) editor;
    isDisabled = false;
    constructor(
        public dialogRef: MatDialogRef<DialogAgentsubComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            if (data.isnew) {
                data.data = {}
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
    onNoClick(): void {
            this.dialogRef.close();
    }

}
