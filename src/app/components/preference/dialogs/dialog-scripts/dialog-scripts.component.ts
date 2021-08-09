import { Component, Inject, ChangeDetectionStrategy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import 'brace';
import 'brace/mode/text';
import 'brace/theme/github';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-scripts',
    templateUrl: './dialog-scripts.component.html',
    styleUrls: ['./dialog-scripts.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class DialogScriptsComponent implements AfterViewInit {
    isValidForm = false;
    isAdmin = false;
    regNum = /^[0-9]+$/;
    regString = /^[a-zA-Z0-9\-\_]+$/;

    @ViewChild('data_view', { static: false }) editor;
    partid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(3),
        Validators.min(1),
        Validators.max(100),
        Validators.pattern(this.regNum)
    ]);

    hep_alias = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString),
    ]);
    profile = new FormControl('', [
        Validators.required,
        Validators.minLength(3)
    ]);
    hepid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(4),
        Validators.min(1),
        Validators.max(10000),
        Validators.pattern(this.regNum)
    ]);
    type = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString),
    ]);

    constructor(
        public dialogRef: MatDialogRef<DialogScriptsComponent>,
        public translateService: TranslateService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                data: {},
                profile: '',
                hepid: 10,
                hep_alias: '',
                partid: 10,
                type: '',
                status: true
            };
        }

        data.data.data = data.isnew ?
            '{}' :
            (typeof data.data.data === 'string' ?
                data.data.data :
                JSON.stringify(data.data.data, null, 4)
            );
        (d => {
            this.partid.setValue(d.partid)
            this.hep_alias.setValue(d.hep_alias);
            this.hepid.setValue(d.hepid);
            this.profile.setValue(d.profile);
            this.type.setValue(d.type);
        })(data.data);
        this.isValidForm = true;
            // const test = this.editor.getEditor().getSession().getAnnotations().filter(annotation => annotation.raw !== `['{a}'] is better written in dot notation.`);
            
    }
    ngAfterViewInit() {
        const options = {
            esnext: true,
            moz: true,
            devel: true,
            browser: true,
            node: true,
            laxcomma: true,
            laxbreak: true,
            lastsemic: true,
            onevar: false,
            passfail: false,
            maxerr: 10000,
            expr: true,
            multistr: true,
            globalstrict: true
        };
        this.editor.getEditor().getSession().$worker.call("setOptions", [options]);
        this.cdr.detectChanges();
    }
    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (!this.partid?.invalid &&
            !this.hep_alias?.invalid &&
            !this.hepid?.invalid &&
            !this.profile?.invalid &&
            !this.type?.invalid
        ) {
            (d => {
                d.partid = this.partid?.value;
                d.hep_alias = this.hep_alias?.value;
                d.hepid = this.hepid?.value;
                d.profile = this.profile?.value;
                d.type = this.type?.value;

            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.partid.markAsTouched();
            this.hep_alias.markAsTouched();
            this.hepid.markAsTouched();
            this.profile.markAsTouched();
            this.type.markAsTouched();

        }
    }
    import(text) {
        this.data.data.data = text;
    }
}
