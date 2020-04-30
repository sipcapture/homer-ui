import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { WidgetArray } from '@app/helpers/widget';
import { PreferenceAdvancedService } from '@app/services';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {
    widgets = {};
    objectKeys = Object.keys;
    constructor(
        private _pas: PreferenceAdvancedService,
        public dialogRef: MatDialogRef<AddDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._pas.getAll().toPromise().then(advancedData => {
            WidgetArray.filter(i => !!i.advancedName).forEach(i => {
                i.enable = advancedData.data.filter(j => j.param === i.advancedName).length > 0;
            });
        });

        this.widgets = WidgetArray.reduce((a, b) => {
            if (!a[b.category]) {
                a[b.category] = [];
            }
            a[b.category].push(b);
            return a;
        }, {});
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}