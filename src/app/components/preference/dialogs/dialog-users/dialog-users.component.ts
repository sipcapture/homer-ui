import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-dialog-users',
    templateUrl: './dialog-users.component.html',
    styleUrls: ['./dialog-users.component.css']
})
export class DialogUsersComponent {
    isValidForm = false;

    pass2: string;
    hidePass1 = true;
    hidePass2 = true;
    constructor(
        public dialogRef: MatDialogRef<DialogUsersComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        if ( data.isnew ) {
            data.data = {
                username: '',
                usergroup: '',
                partid: 10,
                password: '',
                firstname: '',
                email: '',
                lastname: '',
                department: '',
                guid: Functions.newGuid()
            };
        }

        /* be sure that this is string */
        data.data.password = String(data.data.password);

        this.isValidForm = true;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    private validateEmail(email) {
        const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return re.test(String(email).toLowerCase());
    }
    onValid() {
        const d = this.data.data;

        this.isValidForm = d.username !== '' &&
        d.usergroup !== '' &&
        d.partid !== '' &&
        d.password !== '' &&
        d.firstname !== '' &&
        d.email !== '' &&
        this.validateEmail(d.email) &&
        d.lastname !== '' &&
        d.department !== '';
    }
}
