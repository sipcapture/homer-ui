import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-advanced',
  templateUrl: './dialog-advanced.component.html',
  styleUrls: ['./dialog-advanced.component.scss']
})
export class DialogAdvancedComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAdvancedComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if ( data.isnew ) {
        data.data = {
          partid: 10,
          category: '',
          param: '',
          data: {},
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