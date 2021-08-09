import { Component, Inject, ViewChild, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService, DateTimeRangeService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-interceptions',
    templateUrl: './dialog-interceptions.component.html',
    styleUrls: ['./dialog-interceptions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogInterceptionsComponent {
    pickerStart: Date;
    pickerStop: Date;
    filterDateFrom;
    get ranges() {
        return this._dtrs.getRangeByLabel(null, true);
    }
    selectedDateTimeRangeTitle = 'Select Time Range';
    selectedDateTimeRange: any;
    selectedDateTimeRangeZone: string;

    idControl = new FormControl('', [Validators.max(512), Validators.min(1)]);
    isRangeSelected = false;
    isValidForm = false;
    isAdmin = false;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    regNum = /^[0-9]+$/;

    search_ip = new FormControl('');
    gid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(3),
        Validators.min(1),
        Validators.max(100),
        Validators.pattern(this.regNum)
    ]);
    liid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        Validators.min(1),
        Validators.max(512),
        Validators.pattern(this.regNum)
    ]);
    description = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(250),
    ]);
    search_callee = new FormControl('');
    search_caller = new FormControl('');
    constructor(
        public _dtrs: DateTimeRangeService,
        public translateService: TranslateService,
        private authService: AuthenticationService,
        public dialogRef: MatDialogRef<DialogInterceptionsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                uuid: '',
                id: 0,
                gid: 10,
                liid: Math.floor((Math.random() * 512) + 1),
                search_callee: '',
                search_caller: '',
                search_ip: '',
                description: '',
                delivery: {},
                start_date: new Date(),
                stop_date: new Date(new Date().getTime() + 60000 * 60 * 24),
                number: '',
                status: true,
            };
        }
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
        data.data.delivery = data.isnew
            ? '{}'
            : typeof data.data.delivery === 'string'
                ? data.data.delivery
                : JSON.stringify(data.data.delivery, null, 4);
        data.data.delivery = data.isnew ?
            '[]' :
            (typeof data.data.deliver === 'string' ?
                data.data.delivery : JSON.stringify(data.data.delivery));
        (d => {
            this.search_ip.setValue(d.search_ip);
            this.gid.setValue(d.gid);
            this.liid.setValue(d.liid);
            this.search_callee.setValue(d.search_callee);
            this.search_caller.setValue(d.search_caller);
            this.description.setValue(d.description);
        })(data.data);
        this.isValidForm = true;
    }

    dateChanged(eventDate) {
        return !!eventDate ? new Date(eventDate) : null;
    }

    searchChanged(eventValue) {

        return !!eventValue ? String(eventValue) : '';
    }

    setMinDate(date) {
        return date
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onSubmit() {
        if (
            !this.search_ip?.invalid &&
            !this.liid?.invalid &&
            !this.search_callee?.invalid &&
            !this.search_caller?.invalid &&
            !this.description?.invalid &&
            !this.gid?.invalid
        ) {
            (d => {
                d.search_ip = this.search_ip?.value;
                d.id = this.liid?.value;
                d.search_callee = this.search_callee?.value;
                d.search_caller = this.search_caller?.value;
                d.description = this.description?.value;
                d.gid = this.gid?.value;
            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.search_ip.markAsTouched();
            this.liid.markAsTouched();
            this.search_caller.markAsTouched();
            this.search_callee.markAsTouched();
            this.gid.markAsTouched();
            this.description.markAsTouched();
        }
    }
}
