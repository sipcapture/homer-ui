import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _moment from 'moment';
import { TranslateService } from '@ngx-translate/core'
const moment: any = _moment;
@Component({
    selector: 'app-setting-clock-widget-component',
    templateUrl: 'setting-clock-widget.component.html',
    styleUrls: ['./setting-clock-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingClockWidgetComponent {
    arrayTimeZones: Array<string> = [];
    arrayClockType: Array<string> = ['Digital', 'Analog', 'Both'];
    minSize = 8;
    maxSize = 100;
    constructor(
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<SettingClockWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.arrayTimeZones = moment.tz.names();
    }
    onSelectTimeZone(timeZone) {
        this.data.offset = moment.tz(timeZone)._offset;
        this.data.name = timeZone;
        this.data.desc = timeZone;
        this.data.location.offset = moment.tz(timeZone)._offset;
        this.data.location.name = timeZone;
        this.data.location.desc = timeZone;
        this.cdr.detectChanges();
    }
    validateValue(fontSize) {
        return fontSize > this.maxSize ? this.maxSize : fontSize < this.minSize ? this.minSize : fontSize;
    }
    onChange() {
        this.cdr.detectChanges();
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
