import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-setting-result-chart-widget-component',
    templateUrl: 'setting-result-chart-widget.component.html',
    styleUrls: ['./setting-result-chart-widget.component.scss']
})

export class SettingResultChartWidgetComponent {
    constructor(
        public dialogRef: MatDialogRef<SettingResultChartWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
