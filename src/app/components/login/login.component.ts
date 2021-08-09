import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

import { AlertService, AuthenticationService, PreferenceUserService } from '@app/services';
import { UserSecurityService } from '@app/services/user-security.service';
import { MatDialog } from '@angular/material/dialog';

import { ConstValue } from '@app/models/const-value.model';
import { Functions, setStorage } from '@app/helpers/functions';
import { DialogPasswordResetComponent } from './password-reset-dialog/dialog-password-reset.component';

import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'login-layout',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    authTypes: any;
    loading = false;
    submitted = false;
    returnUrl: string;
    title = 'homer';
    type: any;
    types: any;
    typesError = false;
    translateError = false;
    enabledTypes = [];
    error: string;
    caps_lock = false;
    isReady = false;
    localDictionary;
    // authentication;
    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private titleService: Title,
        private cdr: ChangeDetectorRef,
        private userSecurityService: UserSecurityService,
        public dialog: MatDialog,
        private _pus: PreferenceUserService,
        private translateService: TranslateService
    ) {
        // redirect to home if already logged in
        if (this.authenticationService.currentUserValue && !this.authenticationService.currentUserValue.user.force_password) {
            this.router.navigateByUrl('/');

        }
        this.translateService.get('notifications').subscribe(res => {
            this.localDictionary = res;
        })
        this.translateService.addLangs(['en'])

        this.translateService.setDefaultLang('en')



        const browserLang = translateService.getBrowserLang();
        this.translateService.get('LINK').subscribe(data => {
            return data;
        }, error => {
            console.log(error);

            this.translateError = true;
        })
    }
    async getTypes() {
        let authTypes = null;
        try {
            authTypes = await this.authenticationService.getAuthList().toPromise();
        } catch (err) {
            // this.typesError = true;
        }
        const { data } = authTypes || {
            data: {}
        };
        this.types = Object.values(data);
        this.enabledTypes = this.getEnabledTypes(data);
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
            type: [
                (this.enabledTypes.length > 1 ? this.type : this.enabledTypes[0]) || 'internal',
                Validators.required,
            ],
        });

        this.isReady = true;
        this.cdr.detectChanges();
    }
    getEnabledTypes(types: object) {
        return Object.values(types)
            .filter((f) => f.enable === true)
            .map((m) => m.type);
    }
    async ngOnInit() {


        this.getTypes();
        this.titleService.setTitle(this.title);
        const { returnUrl } = this.route.snapshot.queryParams;
        this.returnUrl = returnUrl || '/';
    }

    // convenience getter for easy access to form fields
    get f() {
        return this.loginForm.controls;
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.authenticationService
            .login(this.f.username.value, this.f.password.value, this.f.type.value)
            .pipe(first())
            .subscribe(
                (data) => {
                    if (!data?.user?.force_password) {
                        this.router.navigateByUrl(this.returnUrl);
                        this.userSecurityService.getAdmin();
                    } else {
                        this.openDialog(data);
                    }
                },
                (error) => {
                    this.alertService.error(error);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            );
    }
    async openDialog(data) {

        this.alertService.warning(this.localDictionary.warning.forcePassword);
        const dialogRef = this.dialog.open(DialogPasswordResetComponent, { width: '650px', data: data })
        const dialogData = await dialogRef.afterClosed().toPromise();
        if (typeof dialogData === 'undefined' || dialogData === null) {
            return;
        }
        const user = {
            guid: data.scope,
            old_password: dialogData?.oldPassword,
            password: dialogData?.password
        };
        if (this.f.password.value !== user.old_password) {
            this.alertService.error(this.localDictionary.success.wrongOldPassword);
            return;
        }
        if (user.old_password === user.password) {
            this.alertService.error(this.localDictionary.error.samePasswords);
            return;
        }
        this._pus.updatePassword(user).toPromise().then((res: {
            data: string;
            message: string;
        }) => {
            if (res?.message === 'successfully updated user password') {
                this.alertService.success(this.localDictionary.success.passwordChanged);
                this.f.password.setValue(user.password);
            }
        }
        );
        this.cdr.detectChanges();
    }
    onCapsLock(event) {
        this.caps_lock = event.getModifierState && event.getModifierState('CapsLock');
        this.cdr.detectChanges();
    }
}
