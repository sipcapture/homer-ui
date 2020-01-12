import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-alias',
  templateUrl: './dialog-alias.component.html',
  styleUrls: ['./dialog-alias.component.css']
})
export class DialogAliasComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAliasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if (data.isnew ) {
        data.data = {
          alias: '',
          ip: '',
          port: '',
          mask: '',
          captureID: '',
          status: false,
        }
      }
    }

  onNoClick(): void {
      this.dialogRef.close();
  }

}