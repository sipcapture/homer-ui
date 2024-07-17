import { Component, Inject, ViewChild, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { AuthenticationService, AlertService, PreferenceUserService, PreferenceAdvancedService } from '@app/services';
import { Validators, FormControl, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { emailValidator } from '@app/helpers/email-validator.directive';

import { TranslateService } from '@ngx-translate/core'
import moment from 'moment';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-dialog-users',
  templateUrl: './dialog-users.component.html',
  styleUrls: ['./dialog-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogUsersComponent implements OnInit {
  isValidForm = false;
  isAdmin = false;
  pass2: string;
  hidePass1 = true;
  regString = /^[a-zA-Z0-9\-\_\.]+$/;
  regNum = /^[0-9]+$/;
  regDept = /^[a-zA-Z0-9\-\_\.\s]+$/;
  originalUser = '';
  isCopy = false;
  isNotChanged = true;
  bufferName: string;
  timeout: any;
  lastPasswordChange: string;
  lastLogin: string;
  isDisabled: boolean = true;
  regPassword: RegExp;
  characterRequirements: CharacterRequirements = {
    numbers: true,
    lowercase: true,
    uppercase: true,
    special: false,
  };
  username = new FormControl(
    { value: '', disabled: true }, [
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
    { value: '', disabled: true }, [
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

  groupList: Array<string>;
  bufferGroupList: any;
  dateFormat: string;
  hasStatistics = false;
  constructor(
    private authenticationService: AuthenticationService,
    public dialogRef: MatDialogRef<DialogUsersComponent>,
    private alertService: AlertService,
    private userService: PreferenceUserService,
    public translateService: TranslateService,
    private _pas: PreferenceAdvancedService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
    if (data.isnew) {
      data.data = {
        username: '',
        usergroup: 'user',
        partid: 10,
        password: '',
        firstname: '',
        email: '',
        lastname: '',
        department: '',
        guid: Functions.newGuid(),

      };

    }

    const userData = this.authenticationService.currentUserValue;
    this.isAdmin = userData?.user?.admin === true;
    if (this.isAdmin) {
      this.username.enable();
      this.partid.enable();
    }
    this.isCopy = data.isCopy;
    if (this.isCopy) {
      this.bufferName = data.data.username;
      this.isNotChanged = false;
    }
    /* be sure that this is string */
    data.data.password = String(data.data.password);
    (d => {
      this.originalUser = d.username;
      this.username.setValue(this.isCopy ? d.username + 'COPY' : d.username);
      this.usergroup.setValue(d.usergroup.toLowerCase());
      this.partid.setValue(d.partid);
      this.firstname.setValue(d.firstname);
      this.email.setValue(d.email);
      this.lastname.setValue(d.lastname);
      this.department.setValue(d.department);
      this.lastPasswordChange = d.params?.timestamp_change_password;
      this.lastLogin = d.params?.last_loogin;
    })(data.data);
    if (data.data.params?.last_login || data.data.params?.timestamp_change_password) {
      this.hasStatistics = true;
    }
    this.isValidForm = true;


  }
  async ngOnInit() {
    await lastValueFrom(this.userService
      .getAllGroups())
      .then((groups: any) => {
        this.groupList = groups.data;
      });
    await this.getFormat();
    await this.getPasswordPolicy();
  }
  async getPasswordPolicy() {

    this.password.addValidators(passwordValidator(this.characterRequirements));
    this.password2.addValidators(passwordValidator(this.characterRequirements));
    this.password.updateValueAndValidity();
    this.password2.updateValueAndValidity();
    this.cdr.detectChanges();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  onSubmit() {
    if (!this.username?.invalid &&
      !this.usergroup?.invalid &&
      !this.partid?.invalid &&
      (this.data?.isNew || this.isCopy ? !this.password?.invalid : true) &&
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
      })(this.data.data);

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
  async getFormat() {
    let advancedFormat;

    await this._pas.getSetting('dateTimeFormat', 'system').then((data) => advancedFormat = data[0]?.format);

    if (typeof advancedFormat === 'undefined' || advancedFormat.replace(/\s/, '') === '') {
      const locale = navigator.languages[0];
      const localeData = moment.localeData(locale);
      const dateFormat = localeData.longDateFormat('L');
      const timeFormat = 'HH:mm:ss';
      this.dateFormat = `${dateFormat} ${timeFormat}`;
    } else {
      this.dateFormat = advancedFormat;
    }
    this.lastLogin = moment(this.lastLogin).format(advancedFormat);
    this.lastPasswordChange = moment(this.lastPasswordChange).format(advancedFormat);
    this.cdr.detectChanges();
  }
  validate() {
    if (
      this.username?.invalid ||
      this.usergroup?.invalid ||
      this.partid?.invalid ||
      this.firstname?.invalid ||
      this.email?.invalid ||
      this.lastname?.invalid ||
      (this.data?.isNew || this.isCopy || this.password.value !== ''
        ? this.password?.invalid
        : false) ||
      this.department?.invalid
    ) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
    this.cdr.detectChanges();
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
  async isTaken(user) {
    return this.userService.getAll().toPromise().then((users: any) => {
      return ([].concat(users?.data?.map?.(m => m?.username) || [])).includes(user) && user !== this.originalUser;
    });
  }
  disableClose(e) {
    this.dialogRef.disableClose = e;
  }
  import(text) {
    this.data.data.setting = text;
  }
}
export interface CharacterRequirements {
  special: boolean;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
}

export function passwordValidator(
  characterRequirements: CharacterRequirements
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const specialCharaterRegex = /[\*\.!@#$%^&(){}[\]:;<>,.?\/~_+-=|\\]/;
    const hasSpecial = !characterRequirements.special || specialCharaterRegex.test(control.value);
    const lowercaseRegex = /[a-z]/;
    const hasLowercase = !characterRequirements.lowercase || lowercaseRegex.test(control.value);
    const uppercaseRegex = /[A-Z]/;
    const hasUppercase = !characterRequirements.uppercase || uppercaseRegex.test(control.value);
    const numberRegex = /\d/;
    const hasNumbers = !characterRequirements.numbers || numberRegex.test(control.value);
    const forbidden =
      hasNumbers && hasUppercase && hasLowercase && hasSpecial;
    const missing = [];
    if (!hasNumbers) {
      missing.push('numbers');
    }
    if (!hasLowercase) {
      missing.push('lowercase letters');
    }
    if (!hasUppercase) {
      missing.push('uppercase letters');
    }
    if (!hasSpecial) {
      missing.push('special characters');
    }
    const textMissing = missing.join(', ')
    return !forbidden ? { missingCharacters: { value: textMissing } } : null;
  };
}
