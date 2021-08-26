import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-authkey',
    templateUrl: './dialog-authkey.component.html',
    styleUrls: ['./dialog-authkey.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAuthKeyComponent {
    isValidForm = false;
    isAdmin = false;
    regString = /^[a-zA-Z0-9\-\_\s]+$/;
    name = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString)
    ]);
    constructor(
        private authService: AuthenticationService,
        public dialogRef: MatDialogRef<DialogAuthKeyComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                name: '',
                expire_date: new Date((new Date().getTime() + (7 * 86400 * 1000))),
                active: true
            };
        }
        (d => {
            this.name.setValue(d.name);
        })(data.data);
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (!this.name.invalid) {
            (d => {
                d.name = this.name?.value;
            })(this.data.data);
            this.dialogRef.close(this.data)
        } else {
            this.name.markAsTouched();
        }
    }
}
