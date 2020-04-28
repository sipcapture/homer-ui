import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-dialog-alarm',
    templateUrl: './dialog-alarm.component.html',
    styleUrls: ['./dialog-alarm.component.scss']
})
export class DialogAlarmComponent {

    constructor(public dialogRef: MatDialogRef<DialogAlarmComponent>)  { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
