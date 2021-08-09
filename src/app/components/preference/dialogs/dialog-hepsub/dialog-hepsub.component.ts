import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dialog-hepsub',
    templateUrl: './dialog-hepsub.component.html',
    styleUrls: ['./dialog-hepsub.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogHepsubComponent {
    isValidForm = false;
    isAdmin = false;
    regNum = /^[0-9]+$/;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    type: string;
    json;
    noChanges = new Observable()    
    hep_alias = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString),
        Validators.maxLength(100),
        Validators.pattern(this.regString)
    ]);
    profile = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(this.regString)
    ]);
    hepid = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(4),
        Validators.min(1),
        Validators.max(10000),
        Validators.pattern(this.regNum)
    ]);
    constructor(
        private authService: AuthenticationService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogHepsubComponent>,
        public cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                hep_alias: '',
                hepid: 1,
                profile: '',
                mapping: {}
            };
        } else {
            this.type = data.data.type;
            if (this.type === 'data-preview') {
                this.json = data.data.mapping;
            }
        }
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
        data.data.mapping = data.isnew ?
            '' :
            (typeof data.data.mapping === 'string' ?
                data.data.mapping :
                JSON.stringify(data.data.mapping, null, 4)
            );
        (d => {
            this.hep_alias.setValue(d.hep_alias);
            this.hepid.setValue(d.hepid);
            this.profile.setValue(d.profile);

        })(data.data);
        this.isValidForm = true;
    }

    onNoClick(): void {
        this.noChanges.subscribe( s => {
            this.cdr.detectChanges()
           
        })
        this.dialogRef.close();
        
    }
    onSubmit() {
        if (!this.hep_alias?.invalid &&
            !this.hepid?.invalid &&
            !this.profile?.invalid
        ) {
            (d => {
                d.hep_alias = this.hep_alias?.value;
                d.hepid = this.hepid?.value;
                d.profile = this.profile?.value;

            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.hep_alias.markAsTouched();
            this.hepid.markAsTouched();
            this.profile.markAsTouched();

        }
    }
    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    import(text) {
        this.data.data.mapping = text;
    }
}
