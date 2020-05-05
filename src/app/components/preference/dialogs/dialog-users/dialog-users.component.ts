import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { AuthenticationService, AlertService } from '@app/services';
import { Validators, FormControl } from '@angular/forms';
import { emailValidator } from '@app/helpers/email-validator.directive';

@Component({
    selector: 'app-dialog-users',
    templateUrl: './dialog-users.component.html',
    styleUrls: ['./dialog-users.component.scss']
})
export class DialogUsersComponent {
    isValidForm = false;
    isAdmin = false;
    pass2: string;
    hidePass1 = true;

    // formControls
    
    username = new FormControl('', [Validators.required]);
    usergroup = new FormControl('', [Validators.required]);
    partid = new FormControl('', [Validators.required]);
    password = new FormControl('');
    password2 = new FormControl('');

    firstname = new FormControl('', [Validators.required]);
    email = new FormControl('', [Validators.required, emailValidator()]);
    lastname = new FormControl('', [Validators.required]);
    department = new FormControl('', [Validators.required]);

    constructor(
        private authenticationService: AuthenticationService,
        public dialogRef: MatDialogRef<DialogUsersComponent>,
        private alertService: AlertService,
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

        (d => {
            this.username.setValue(d.username);
            this.usergroup.setValue(d.usergroup);
            this.partid.setValue(d.partid);
            this.firstname.setValue(d.firstname);
            this.email.setValue(d.email);
            this.lastname.setValue(d.lastname);
            this.department.setValue(d.department);
        })(data.data);

        this.isValidForm = true;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    
    onSubmit() {
        if (!this.username.invalid && 
            !this.usergroup.invalid && 
            !this.partid.invalid && 
            (this.data.isNew ? !this.password.invalid : true) && 
            !this.firstname.invalid && 
            !this.email.invalid && 
            !this.lastname.invalid && 
            !this.department.invalid
        ) {
            (d => {
                d.username = this.username.value;
                d.usergroup = this.usergroup.value;
                d.partid = this.partid.value;
                d.password = this.password.value;
                d.firstname = this.firstname.value;
                d.email = this.email.value;
                d.lastname = this.lastname.value;
                d.department = this.department.value;
            })(this.data.data)

            this.dialogRef.close(this.data);
        } else {
            this.username.markAsTouched();
            this.usergroup.markAsTouched();
            this.partid.markAsTouched();

            this.password.markAsTouched();
            this.password2.markAsTouched();
            
            this.firstname.markAsTouched();
            this.email.markAsTouched();
            
            this.lastname.markAsTouched();
            this.department.markAsTouched();
        }
    }
    getErrorMessage() {
        return this.email.hasError('required') ? 'You must enter a value' : 'Not a valid email';
    }
}
