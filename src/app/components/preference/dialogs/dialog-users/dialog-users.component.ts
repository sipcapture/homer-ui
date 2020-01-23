import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { AuthenticationService } from '@app/services';

@Component({
    selector: 'app-dialog-users',
    templateUrl: './dialog-users.component.html',
    styleUrls: ['./dialog-users.component.css']
})
export class DialogUsersComponent {
    isValidForm = false;
    isAdmin = false;
    pass2: string;
    hidePass1 = true;
    hidePass2 = true;
    constructor(
        private authenticationService: AuthenticationService,
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
        
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin = userData && userData.user && userData.user.admin && userData.user.admin == true;
        

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
        const isNew = this.data.isNew;
        this.isValidForm = d.username !== '' &&
        d.usergroup !== '' &&
        d.partid !== '' &&
        (isNew ? d.password !== '' : true) &&
        d.password === this.pass2 &&
        d.firstname !== '' &&
        d.email !== '' &&
        this.validateEmail(d.email) &&
        d.lastname !== '' &&
        d.department !== '';
    }
}
