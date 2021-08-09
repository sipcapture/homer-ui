import { Component, Inject, ViewChild, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { AuthenticationService, AlertService, PreferenceUserService } from '@app/services';
import { Validators, FormControl, AbstractControl } from '@angular/forms';
import { emailValidator } from '@app/helpers/email-validator.directive';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-password-reset',
    templateUrl: './dialog-password-reset.component.html',
    styleUrls: ['./dialog-password-reset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})


export class DialogPasswordResetComponent implements OnInit {

    regPassword = /^(\d*[a-zA-Z]+\d*)+$/;
    hidePass1 = true;
    force_password = true;
    oldPassword = new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        Validators.pattern(this.regPassword)
    ]);
    password = new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        Validators.pattern(this.regPassword)
    ]);
    password2 = new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        Validators.pattern(this.regPassword)
    ]);
    username = new FormControl('');
    constructor(
        public dialogRef: MatDialogRef<DialogPasswordResetComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.username.setValue(data.user.username);
    }
    ngOnInit() {
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (
            !this.password?.invalid
        ) {
            (d => {
                d.oldPassword = this.oldPassword?.value;
                d.password = this.password?.value;
            })(this.data);

            this.dialogRef.close(this.data);
        } else {
            this.password.markAsTouched();
            this.password2.markAsTouched();
        }
    }

}
