import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { PreferenceAdvancedService } from './preferences/advanced.service';

export interface DateFormat {
    time: string;
    date: string;
    dateTime: string;
    dateTimeMs: string;
    dateTimeMsZ: string;
}
@Injectable({
  providedIn: 'root'
})
export class TimeFormattingService {
    _dateFormat;
    get dateFormat(): DateFormat {
        return this._dateFormat;
    };
    set dateFormat(val) {
        this._dateFormat = val;
    }
    constructor(
        private _pas: PreferenceAdvancedService) {
            this.getFormat();
        }

    
    async getFormat() {
        let advancedFormat;
        try {
            await this._pas.getSetting('dateTimeFormat', 'system', 300 * 1000).then((data) => advancedFormat = data[0]?.format); // 10 minute buffer because we don't exactly need fresh data for this.
        } catch (err) {
            // console.error(err);
        }
        if (typeof advancedFormat === 'undefined' || advancedFormat.replace(/\s/, '') === '' || advancedFormat === null) {
            const locale = navigator.languages[0];
            const localeData = moment.localeData(locale);
            const dateFormat = localeData.longDateFormat('L');
            const timeFormat = 'HH:mm:ss';
            this.dateFormat = {
                time: timeFormat,
                date: dateFormat,
                dateTime: `${dateFormat} ${timeFormat}`,
                dateTimeMs: `${dateFormat} ${timeFormat}.SSS`,
                dateTimeMsZ: `${dateFormat} ${timeFormat}.SSS Z`,
            }
            
        } else {
            // this.dateFormat = advancedFormat;
            const timeRegex = /[H|h]{2}.mm.ss/;
            const dateRegex = /[Y|M|D]+.[Y|M|D]+.[Y|M|D]+/;
            const timeFormat = advancedFormat.match(timeRegex)[0];
            const dateFormat = advancedFormat.match(dateRegex)[0];
            const dateTime = advancedFormat;
            const dateTimeMs = `${dateFormat} ${timeFormat}.SSS`;
            const dateTimeMsZ = `${dateFormat} ${timeFormat}.SSS Z`;

            this.dateFormat = {
                time: timeFormat,
                date: dateFormat,
                dateTime: dateTime,
                dateTimeMs: dateTimeMs,
                dateTimeMsZ: dateTimeMsZ
            }
        }
        return this.dateFormat;
    }
    
}
