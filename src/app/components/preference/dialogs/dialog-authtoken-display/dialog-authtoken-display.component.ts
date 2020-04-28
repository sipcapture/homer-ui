import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-authtoken-display',
  templateUrl: './dialog-authtoken-display.component.html',
  styleUrls: ['./dialog-authtoken-display.component.scss']
})

export class DialogAuthTokenDisplayComponent {
  token: "empty";

  constructor(
    public dialogRef: MatDialogRef<DialogAuthTokenDisplayComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.token = data.data.token      
    }

  onNoClick(): void {
      this.dialogRef.close();
  }
}


