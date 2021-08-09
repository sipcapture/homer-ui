import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-db-selector',
    templateUrl: './dialog-db-selector.component.html',
    styleUrls: ['./dialog-db-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogDBSelectorComponent {
    isValidForm = false;
    isAdmin = false;
    canSave = false;
    node_src = new FormControl('');
    node_dst = new FormControl('');
    tables = new FormControl([]);
    tableSelection = [];
    nodeSelection = [];
    dialogData;
    constructor(
        private authService: AuthenticationService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogDBSelectorComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')

        this.nodeSelection = data.data.db_list;
        this.tableSelection = data.data.table_list;
        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;

        (d => {
            this.node_src.setValue(d.db_src);
            this.node_dst.setValue(d.node_dst);
            this.tables.setValue(d.tables);

        })(data.data);
        this.isValidForm = true;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (!this.node_src?.invalid &&
            !this.node_dst?.invalid &&
            !this.tables?.invalid
        ) {
            (d => {
                d.node_src = this.node_src?.value;
                d.node_dst = this.node_dst?.value;
                d.tables = this.tables?.value;

            })(this.data.data);
            this.dialogRef.close(this.data);
        } else {
            this.node_src.markAsTouched();
            this.node_dst.markAsTouched();
            this.tables.markAsTouched();

        }
    }
    isSrc(opt) {
        return opt === this.node_src.value;
    }
    isDst(opt) {
        return opt === this.node_dst.value;
    }
    disableClose(e) {
        this.dialogRef.disableClose = e;
    }

    onSelectionChange($event) {


        const selectionId = $event?.source?._id;
        (d => {
            d[selectionId] = this[selectionId]?.value;
        })(this.data.data);

        if (this.tables.value.length > 0 && this.node_dst.value !== '' && this.node_src.value !== '') {
            this.canSave = true;
        }
    }
}
