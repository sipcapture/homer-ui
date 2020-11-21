import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-hepsub',
    templateUrl: './dialog-hepsub.component.html',
    styleUrls: ['./dialog-hepsub.component.scss']
})
export class DialogHepsubComponent {
    @ViewChild('data_view', {static: false}) editor;
    isDisabled = false;

    constructor(
        public dialogRef: MatDialogRef<DialogHepsubComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            if (data.isnew) {
                data.data = {
                    hep_alias: '',
                    hepid: 1,
                    profile: '',
                    mapping: {}
                }
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
