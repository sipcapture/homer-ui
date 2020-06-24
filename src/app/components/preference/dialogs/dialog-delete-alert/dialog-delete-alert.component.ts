import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-delete-alert',
  templateUrl: './dialog-delete-alert.component.html',
  styleUrls: ['./dialog-delete-alert.component.scss']
})
export class DialogDeleteAlertComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogDeleteAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
      this.dialogRef.close();
  }
}


