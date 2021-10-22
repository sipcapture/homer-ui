import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

import { AlertService, AuthenticationService, PreferenceUserService } from '@app/services';
import { UserSecurityService } from '@app/services/user-security.service';
import { MatDialog } from '@angular/material/dialog';

import { ConstValue } from '@app/models/const-value.model';
import { Functions, setStorage } from '@app/helpers/functions';

import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'login-layout',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {    
    @ViewChild('oAuthButton', { static: false }) oAuthButton;
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
    oAuthTypes;
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
        if (this.authenticationService?.currentUserValue ) {
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
            // console.log(error);

            this.translateError = true;
        })
    }
    async getTypes() {
        let authTypes = null;
        try {
            authTypes = await this.authenticationService.getAuthList().toPromise();
            this.cdr.detectChanges()
        } catch (err) {
            // this.typesError = true;
        }
        const { data } = authTypes || {
            data: {}
        };
        this.types = Object.values(data);
        this.oAuthTypes = data?.oauth2.filter(type => type.enable)
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
        setTimeout(() => {
            
        console.log(this.oAuthButton._elementRef.nativeElement.clientWidth)
        }, 1000);
        this.cdr.detectChanges();
    }
    getEnabledTypes(types: object) {
        return Object.values(types)
            .filter((f) => f.enable === true)
            .map((m) => m.type);
    }
    goOauth(type) {
        console.log(type.url)
        // this.router.navigate([type.url], {relativeTo: this.route}).then;
        this.router.navigate([]).then((result) => {
            window.location.href = `http://homer.null.qxip.net${type.url}`;
        });
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
                    if (data) {
                        this.router.navigateByUrl(this.returnUrl);
                        this.userSecurityService.getAdmin();
                    } 
                },
                (error) => {
                    this.alertService.error(error);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            );
    }

    onCapsLock(event) {
        this.caps_lock = event.getModifierState && event.getModifierState('CapsLock');
        this.cdr.detectChanges();
    }
}
