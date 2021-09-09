import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'

@Component({
    selector: 'app-dialog-alias',
    templateUrl: './dialog-alias.component.html',
    styleUrls: ['./dialog-alias.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAliasComponent {
    @ViewChild('data_view', { static: false }) editor;
    aliasLink = '';
    isNotChanged = false;
    isCopy = false;
    actionType: string;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    regAliasString = /^[a-zA-Z0-9\-\_\&\@]+$/;
    regNum = /^[0-9]+$/;
    regip = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;

    alias = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(24),
        Validators.pattern(this.regAliasString)],
    );

    mask = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        Validators.min(1),
        Validators.max(32),
        Validators.pattern(this.regNum)
    ]);

    port = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        Validators.min(0),
        Validators.max(65353),
        Validators.pattern(this.regNum)
    ]);

    ip = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(45),
        Validators.pattern(this.regip),
        this.cannotContainSpace
    ]);

    captureID = new FormControl('',[
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100)
    ])

    constructor(
        public dialogRef: MatDialogRef<DialogAliasComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                alias: 'localhost',
                ip: '127.0.0.1',
                port: 5060,
                mask: 32,
                captureID: 'CAP101',
                status: false,
            };
        }

        data.data.captureID = data.isnew ?
            'CAP101' :
            (typeof data.data.captureID === 'number' ?
                data.data.captureID : String(data.data.captureID)
            );

    }

    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    cannotContainSpace(control: AbstractControl) {
        if((control.value as string).indexOf(' ') >= 0){
            return {cannotContainSpace: true}
        }
  
        return null;
    }

    onSubmit() {
        if (!this.alias?.invalid &&
            !this.ip?.invalid &&
            !this.port?.invalid &&
            !this.captureID.invalid &&
            !this.mask?.invalid
        ) {
            (d => {
                d.alias = this.alias?.value;
                d.mask = this.mask?.value;
                d.port = this.port?.value;
                d.ip = this.ip?.value.trim();
                d.captureID = this.captureID?.value;
            })(this.data.data);
           
            this.dialogRef.close(this.data);
        } else {
            this.alias.markAsTouched();
            this.mask.markAsTouched();
            this.port.markAsTouched();
            this.captureID.markAsTouched();
            this.ip.markAsTouched();

        }
    }

}
