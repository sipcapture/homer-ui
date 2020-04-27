import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-authkey',
    templateUrl: './dialog-authkey.component.html',
    styleUrls: ['./dialog-authkey.component.scss']
})
export class DialogAuthKeyComponent {    
    constructor(
        public dialogRef: MatDialogRef<DialogAuthKeyComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            if (data.isnew ) {
                data.data = {
                    name: 'Token',
                    expire_date: new Date((new Date().getTime() + (7*86400*1000))),
                    active: true                    
                };
            }        
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
