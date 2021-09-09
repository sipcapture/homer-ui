import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-setting-result-chart-widget-component',
    templateUrl: 'setting-result-chart-widget.component.html',
    styleUrls: ['./setting-result-chart-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingResultChartWidgetComponent {
    constructor(
        public dialogRef: MatDialogRef<SettingResultChartWidgetComponent>,
public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
     }

    isInvalid: boolean;
    validate(event) {
        event = event.trim();
        if (event === '' || event === ' ') {
            this.isInvalid = true;
        } else {
            this.isInvalid = false;
        }
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
