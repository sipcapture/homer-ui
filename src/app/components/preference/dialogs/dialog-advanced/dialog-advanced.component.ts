import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-advanced',
    templateUrl: './dialog-advanced.component.html',
    styleUrls: ['./dialog-advanced.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAdvancedComponent {
    @ViewChild('data_view', { static: false }) editor;
    isDisabled = false;
    isValidForm = false;
    isAdmin = false;
    regNum = /^[0-9]+$/;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    type: string;
    json;
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

    constructor(
        private authService: AuthenticationService,
        public dialogRef: MatDialogRef<DialogAdvancedComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                partid: 10,
                category: '',
                param: '',
                data: {},
            }
        } else {
            this.type = data.data.type;
            if (this.type === 'data-preview') {
                this.json = data.data.data
            }
        }
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
        data.data.data = data.isnew ?
            '' :
            (typeof data.data.data === 'string' ?
                data.data.data :
                JSON.stringify(data.data.data, null, 4)
            );
        (d => {
            this.category.setValue(d.category);
            this.param.setValue(d.param);
            this.partid.setValue(d.partid);
        })(data.data);
        this.isValidForm = true;
    }

    validate() {
        if (this.editor.getEditor().getSession().getAnnotations().length > 0) {
            this.isDisabled = true;
        } else {
            this.isDisabled = false;
        }
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    onSubmit() {
        if (
            !this.category?.invalid &&
            !this.param?.invalid &&
            !this.partid?.invalid
        ) {
            (d => {
                d.category = this.category?.value;
                d.param = this.param?.value;
                d.partid = this.partid?.value;
            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.category.markAsTouched();
            this.param.markAsTouched();
            this.partid.markAsTouched();
        }
    }
    import(text) {
        this.data.data.data = text;
    }
}
