import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-alias',
    templateUrl: './dialog-alias.component.html',
    styleUrls: ['./dialog-alias.component.scss']
})
export class DialogAliasComponent {

    constructor(
        public dialogRef: MatDialogRef<DialogAliasComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            if (data.isnew ) {
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

    onNoClick(): void {
        this.dialogRef.close();
    }

}
