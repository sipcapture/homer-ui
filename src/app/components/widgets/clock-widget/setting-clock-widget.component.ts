import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeZone } from './clock-widget.component';
// import * as moment from 'moment';
import * as _moment from 'moment';

const moment: any = _moment;
@Component({
    selector: 'app-setting-clock-widget-component',
    templateUrl: 'setting-clock-widget.component.html',
    styleUrls: ['./setting-clock-widget.component.css']
})

export class SettingClockWidgetComponent {
    arrayTimeZones: Array<string> = [];

    constructor(
        public dialogRef: MatDialogRef<SettingClockWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.arrayTimeZones = moment.tz.names();
    }
    onSelectTimeZone(timeZone) {
        this.data.offset = moment.tz(timeZone)._offset;
        this.data.name = timeZone;
        this.data.desc = timeZone;
        this.data.location.offset = moment.tz(timeZone)._offset;
        this.data.location.name = timeZone;
        this.data.location.desc = timeZone;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
