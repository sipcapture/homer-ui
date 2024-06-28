import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { emailValidator } from '@app/helpers/email-validator.directive';
import { Functions } from '@app/helpers/functions';
import { UserProfile } from '@app/models';
import { AlertService, AuthenticationService, PreferenceUserService, UserSecurityService } from '@app/services';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-page-profile',
  templateUrl: './page-profile.component.html',
  styleUrls: ['./page-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageProfileComponent implements OnInit {
  
  regString = /^[a-zA-Z0-9\-\_\.]+$/;
  regNum = /^[0-9]+$/;
  regDept = /^[a-zA-Z0-9\-\_\.\s]+$/;
  lastPasswordChange: string;
  lastLogin: string;
  originalUser = '';
  hasStatistics = false;
  hidePass1 = true;
  idColorHash = Functions.idColorHash
  groupList: Array<string>;
  profileColor = ''
  username = new FormControl(
      {value:'', disabled: true},[
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
      Validators.pattern(this.regString)],
      this.usernameValidator.bind(this)
  );
  /* usergroup = new FormControl('',  [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
      Validators.pattern(this.regString)
  ]); */
  usergroup = new FormControl('');
  partid = new FormControl(
      {value:'', disabled: true}, [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(100),
      Validators.min(1),
      Validators.max(99),
      Validators.pattern(this.regNum)
  ]);
  password = new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(100)
      
  ]);
  password2 = new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(100)

  ]);

  firstname = new FormControl('', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(100),
      Validators.pattern(this.regString)
  ]);

  email = new FormControl('', [
      Validators.required,
      emailValidator()]);
  lastname = new FormControl('', [
      Validators.maxLength(100),
      Validators.pattern(this.regString)
  ]);

  department = new FormControl('', [
      Validators.minLength(1),
      Validators.maxLength(100),
      Validators.pattern(this.regDept)
  ]);
  bufferGroup: string;
  isLoading = false;
  isAdmin = false;
  isExternal = false;
  isErrorResponse = false;
  @Input() page: string;
  @Input() pageID: string;
  userProfile: UserProfile
  data: any;
  timeout: any;
  constructor(        
    private service: PreferenceUserService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private userSecurityService: UserSecurityService,
    private router: Router,
    private alertService: AlertService,
  ) {
    const userData = this.authenticationService.currentUserValue;
    
    this.isAdmin =
    userData &&
    userData.user &&
    userData.user.admin &&
    userData.user.admin === true;
    this.isExternal =
    userData &&
    userData.user &&
    userData.user.isExternal &&
    userData.user.isExternal === true;
  }

  async ngOnInit() {
    await this.getProfile()
    await lastValueFrom(this.service
      .getAllGroups())
      .then((groups: any) => {
        this.groupList = groups.data;
      });
  }
  async getProfile() {
    const { data } = await lastValueFrom(this.service.getCurrentUser()).then(res =>{
      if (!this.isExternal) {
        this.getUser(res.data.guid);
      }
      return res;
    })
    this.userProfile = data;
    this.profileColor = this.idColorHash(this.userProfile.guid)
    this.cdr.detectChanges();
  }
  async getUser(guid) {
    const {data} = await lastValueFrom(this.service.getById(guid));
    [this.data] = data;
      (d => {
        this.originalUser = d.username;
        this.username.setValue(d.username);
        this.usergroup.setValue(d.usergroup.toLowerCase());
        this.partid.setValue(d.partid);
        this.firstname.setValue(d.firstname);
        this.email.setValue(d.email);
        this.lastname.setValue(d.lastname);
        this.department.setValue(d.department);
        this.lastPasswordChange = d.params?.timestamp_change_password;
        this.lastLogin = d.params?.last_loogin;
    })(this.data);
    this.bufferGroup = this.data.usergroup;
    if (this.data.params?.last_login || this.data.params?.timestamp_change_password) {
      this.hasStatistics = true;
    }
  }
  
  usernameValidator(userControl: AbstractControl) {
    return new Promise(resolve => {
        if (typeof this.timeout !== 'undefined') {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            let validated = false;
            this.isTaken(userControl.value).then(data => {
                validated = data;
                resolve(validated ? { userNameNotAvailable: true } : null);
            });
        }, 500);
    });
  
  }
  isTaken(user) {
    return this.service.getAll().toPromise().then((users: any) => {
        return ([].concat(users?.data?.map?.(m => m?.username) || [])).includes(user) && user !== this.originalUser;
    });
  }
  onSubmit() {
    const result:any = {}
    if (!this.username?.invalid &&
        !this.usergroup?.invalid &&
        !this.partid?.invalid &&
        !this.firstname?.invalid &&
        !this.email?.invalid &&
        !this.lastname?.invalid &&
        !this.department?.invalid
    ) {
      
        (d => {
            d.username = this.username?.value;
            d.usergroup = this.usergroup?.value;
            d.partid = this.partid?.value;
            d.password = this.password?.value;
            d.firstname = this.firstname?.value;
            d.email = this.email?.value;
            d.lastname = this.lastname?.value;
            d.department = this.department?.value;
            d.guid = this.userProfile.guid;
        })(result);
        lastValueFrom(this.service.update(result))        
        .then(() => {
            if (this.data.usergroup !== this.bufferGroup || result.password) {
                this.userSecurityService.removeUserSettings();
                this.authenticationService.logout();
                this.router.navigate([{ outlets: { primary: null, system: 'login' } }]);
            }
            this.alertService.success(`${this.page} Successfully  Updated`);

        }, () => {
            this.alertService.error(`Failed to Update ${this.page}`)
        });
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
