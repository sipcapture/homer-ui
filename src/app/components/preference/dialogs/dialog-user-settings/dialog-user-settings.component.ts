import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-user-settings',
    templateUrl: './dialog-user-settings.component.html',
    styleUrls: ['./dialog-user-settings.component.css']
})
export class DialogUserSettingsComponent {

    constructor(
        public dialogRef: MatDialogRef<DialogUserSettingsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if ( data.isnew ) {
            data.data = {
                category: '',
                data: {},
                param: '',
                partid: 10,
                username: ''
            };
        }
        data.data.data = data.isnew ? 
            '' :
            (typeof data.data.data === 'string' ?
                data.data.data :
                JSON.stringify(data.data.data, null, 4)
            );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
