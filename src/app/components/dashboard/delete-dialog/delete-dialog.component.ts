import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
    styleUrls: ['./delete-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
      public translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
       translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }

  onNoClick(): void {
      this.dialogRef.close();
  }
}


