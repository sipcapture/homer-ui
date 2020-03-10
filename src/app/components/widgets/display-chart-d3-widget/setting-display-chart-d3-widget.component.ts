import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-setting-display-chart-d3',
  templateUrl: './setting-display-chart-d3-widget.component.html',
  styleUrls: ['./setting-display-chart-d3-widget.component.css']
})
export class SettingDisplayChartD3WidgetComponent {

  constructor(
    public dialogRef: MatDialogRef<SettingDisplayChartD3WidgetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

onNoClick(): void {
    this.dialogRef.close();
}

}
