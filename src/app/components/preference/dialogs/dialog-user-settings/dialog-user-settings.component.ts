import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService, PreferenceUserService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-user-settings',
    templateUrl: './dialog-user-settings.component.html',
    styleUrls: ['./dialog-user-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogUserSettingsComponent {
    isValidForm = false;
    isAdmin = false;
    regNum = /^[0-9]+$/;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    currentUser = '';
    userList: any;
    type: string;
    json;
    settingJSON;
    hasSettings: boolean;
    category = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString)
    ]);
    param = new FormControl('', [
        Validators.required,
        Validators.minLength(3)
    ]);
    partid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(3),
        Validators.min(1),
        Validators.max(100),
        Validators.pattern(this.regNum)
    ]);
    username = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString),
    ],
        this.usernameIsValid.bind(this)
    );

    constructor(
        public dialogRef: MatDialogRef<DialogUserSettingsComponent>,
        public translateService: TranslateService,
        private userService: PreferenceUserService,
        private authService: AuthenticationService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                category: '',
                data: {},
                setting: {},
                param: '',
                partid: 10,
                username: '',
            };
        } else {
            this.type = data.data.type;
            if (this.type === 'data-preview') {
                this.json = data.data.data;
                this.settingJSON = data.data.setting;
                this.hasSettings = typeof data?.data?.setting === 'object' && !!Object.keys(data?.data?.setting)?.length;
            }
        }
        const userData: any = this.authService.currentUserValue;


        this.currentUser = userData?.user?.username;

        this.isAdmin = !!userData?.user?.admin;
        data.data.data = data.isnew
            ? ''
            : typeof data.data.data === 'string'
                ? data.data.data
                : JSON.stringify(data.data.data, null, 4);
        data.data.setting = data.isnew
            ? ''
            : typeof data.data.setting === 'string'
                ? data.data.setting
                : JSON.stringify(data.data.setting, null, 4);
        (d => {
            this.username.setValue(d.username);
            this.category.setValue(d.category);
            this.param.setValue(d.param);
            this.partid.setValue(d.partid);
        })(data.data);
        this.isValidForm = true;
    }
    ngAfterContentInit() {
        this.userList = this.userService.getAll().toPromise().then(({ data }: any) => data?.map(m => m?.username));
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (!this.username?.invalid &&
            !this.category?.invalid &&
            !this.param?.invalid &&
            !this.partid?.invalid
        ) {
            (d => {
                d.username = this.username?.value;
                d.category = this.category?.value;
                d.param = this.param?.value;
                d.partid = this.partid?.value;
            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.username.markAsTouched();
            this.category.markAsTouched();
            this.param.markAsTouched();
            this.partid.markAsTouched();
        }
    }
    usernameIsValid(userControl: AbstractControl) {
        return new Promise(resolve => {
            setTimeout(() => {
                let isUser = false;
                this.isUser(userControl.value).then(user => {
                    isUser = user;
                    if (!isUser) {
                        resolve({ userNameNotAvailable: true });
                    } else {
                        resolve(null);
                    }
                });
            }, 500);
        });
    }

    async isUser(user) {
        return this.userService.getAll().toPromise().then((users: any) => {
            return ([].concat(users?.data?.map?.(m => m?.username) || []).includes(user));
        });
    }

    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    import(text, type) {
        this.data.data[type] = text;
    }
}
