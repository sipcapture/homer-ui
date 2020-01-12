import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-hepsub',
  templateUrl: './dialog-hepsub.component.html',
  styleUrls: ['./dialog-hepsub.component.css']
})
export class DialogHepsubComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogHepsubComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if (data.isnew) {
        data.data = {
          hep_alias: '',
          hepid: '',
          profile: '',
          data: {}
        }
      }
      data.data.data = data.isnew ? 
            '' :
            (typeof data.data.data === 'string' ?
                data.data.data :
                JSON.stringify(data.data.data, null, 4)
            );
    }

  onNoClick(): void {
      this.dialogRef.close();
  }

}
