import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-users',
  templateUrl: './dialog-users.component.html',
  styleUrls: ['./dialog-users.component.css']
})
export class DialogUsersComponent {
  isValidForm: boolean = false;

  pass2: string;
  hidePass1 = true;
  hidePass2 = true;
  constructor(
    public dialogRef: MatDialogRef<DialogUsersComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      if ( data.isnew ) {
        data.data = {
          username: '',
          usergroup: '',
          partid: '',
          password: '',
          firstname: '',
          email: '',
          lastname: '',
          department: '',
        }
      }
      this.isValidForm = true;
    }

  onNoClick(): void {
      this.dialogRef.close();
  }
  private validateEmail(email) {
    const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  }
  onValid() {
    const d = this.data.data;

    this.isValidForm = d.username !== '' &&
      d.usergroup !== '' &&
      d.partid !== '' &&
      d.password !== '' &&
      d.firstname !== '' &&
      d.email !== '' &&
      this.validateEmail(d.email) &&
      d.lastname !== '' &&
      d.department !== '';
  }
}
