import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services';

@Component({
    selector: 'app-dialog-export',
    templateUrl: './dialog-export.component.html',
    styleUrls: ['./dialog-export.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogExportComponent {
    pageId: string = 'users';


    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any){
            this.pageId = data.pageId;
    }
}
