import { Component, Inject } from '@angular/core';
import { ProxyService } from '../../../services/proxy.service';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { SelectList } from '../influxdbchart-widget/setting-influxdbchart-widget.component';

@Component({
    selector: 'app-iframe-rsearch-widget-component',
    templateUrl: 'setting-general-iframe-widget.component.html',
    styleUrls: ['./setting-general-iframe-widget.component.scss']
})

export class SettingGeneralIframeWidgetComponent {

    dashboardList: SelectList[] = [];
    panelList: SelectList[] = [];
    dashboardSource: any;
    panelListValue: any;

    constructor(
        public dialogRef: MatDialogRef<SettingGeneralIframeWidgetComponent>,
        private _ps: ProxyService,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
