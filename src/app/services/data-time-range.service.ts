import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService, UserSettings } from './session-storage.service';
import moment from 'moment-timezone';
// const moment: any = _moment;


export interface DateTimeTick {
    _id?: number;
    isImportant?: boolean;
    range: {
        title: string;
        timezone: string;
        dates: any;
    };
}

export interface Timestamp {
    from: number;
    to: number;
}
@Injectable({
    providedIn: 'root'
})
export class DateTimeRangeService {
    public static dateTimeRangr: any = {
        title: '',
        timezone: '',
        dates: []
    };

    private refresher = new BehaviorSubject<number>(0);
    castRefresher = this.refresher.asObservable();

    private rangeUpdateTimeout = new BehaviorSubject<DateTimeTick>({
        _id: 0,
        range: DateTimeRangeService.dateTimeRangr
    });
    castRangeUpdateTimeout = this.rangeUpdateTimeout.asObservable();

    delayRefresher = 0;

    _interval: any;

    constructor(
        private _sss: SessionStorageService
    ) {
        this.setDelay(this.delayRefresher);
        this._sss.sessionStorage.subscribe((data: UserSettings) => {
            if (data.updateType !== 'proto-search') {
                if (data && data.dateTimeRange.dates) {
                    DateTimeRangeService.dateTimeRangr.title = data.dateTimeRange.title;
                    DateTimeRangeService.dateTimeRangr.timezone = data.dateTimeRange.timezone;
                    DateTimeRangeService.dateTimeRangr.dates = data.dateTimeRange.dates.map(i => moment(i));
                }
            }
        });
    }
    /**
     * Set delay ro auto refresh
     * @param delay number of milliseconds
     */
    setDelay(delay: number) {
        this.delayRefresher = delay;
        if (this._interval) {
            clearInterval(this._interval);
        }
        // if delay === 0, then is no refresh
        if (delay === 0) {
            return;
        }

        this._interval = setInterval(this.refresh.bind(this), this.delayRefresher);
    }
    refresh(isImportant = false) {
        DateTimeRangeService.dateTimeRangr.dates =
            this.getRangeByLabel(DateTimeRangeService.dateTimeRangr.title) ||
            DateTimeRangeService.dateTimeRangr.dates;

        this.rangeUpdateTimeout.next({
            _id: Date.now(),
            range: DateTimeRangeService.dateTimeRangr,
            isImportant
        });
    }
    getDatesForQuery(isUnixFormat = false): Timestamp {
        const _dates = (this.getRangeByLabel(DateTimeRangeService.dateTimeRangr.title) ||
            DateTimeRangeService.dateTimeRangr.dates).map(d => {
                if (typeof d === 'string') {
                  d = moment(d)
                }
                d = d.unix() * 1;
                if (isUnixFormat) {
                    d *= 1000;
                }
                return d;
            });

        return {
            from: _dates[0],
            to: _dates[1]
        };
    }

    getTimezoneForQuery() {
        return (DateTimeRangeService.dateTimeRangr.timezone || moment.tz.guess());
    }

    /**
     * "Now" in the picker timezone (for rolling quick ranges and calendar presets).
     */
    private nowTz(): moment.Moment {
        const tz = DateTimeRangeService.dateTimeRangr.timezone || moment.tz.guess();
        return moment.tz(tz);
    }

    private rollingMinutes(mins: number): [moment.Moment, moment.Moment] {
        const n = this.nowTz();
        return [n.clone().subtract(mins, 'minutes'), n.clone()];
    }

    /**
     * Rolling window of N full days ending at "now" in the picker timezone.
     */
    private rollingDaysRange(days: number): [moment.Moment, moment.Moment] {
        const n = this.nowTz();
        return [n.clone().subtract(days, 'days'), n.clone()];
    }

    getRangeByLabel(label: string, isAll = false) {
        if (!label || label === '') {
            label = 'Today';
        }
        const n = this.nowTz();
        const arr = {
            'Last 5 minutes': this.rollingMinutes(5),
            'Last 10 minutes': this.rollingMinutes(10),
            'Last 15 minutes': this.rollingMinutes(15),
            'Last 30 minutes': this.rollingMinutes(30),
            'Last 1 hour': this.rollingMinutes(60),
            'Last 3 hours': [n.clone().subtract(3, 'hours'), n.clone()],
            'Last 6 hours': [n.clone().subtract(6, 'hours'), n.clone()],
            'Last 12 hours': [n.clone().subtract(12, 'hours'), n.clone()],
            'Last 24 hours': [n.clone().subtract(24, 'hours'), n.clone()],
            'Today': [n.clone().startOf('day'), n.clone()],
            'Yesterday': [n.clone().subtract(1, 'day').startOf('day'), n.clone().subtract(1, 'day').endOf('day')],
            'Last 7 days': this.rollingDaysRange(7),
            'Last 14 days': this.rollingDaysRange(14),
            'This month': [n.clone().startOf('month'), n.clone().endOf('month')],
            'Last month': [n.clone().subtract(1, 'month').startOf('month'), n.clone().subtract(1, 'month').endOf('month')],
        }
        if (isAll) {
            return arr;
        }
        return arr[label];
    }

    /**
     * ReNew DataRange
     * @param dtr object = {lable, datas[date1, date2]}
     */
    updateDataRange(dtr: any) {
        DateTimeRangeService.dateTimeRangr.title = dtr.title;
        DateTimeRangeService.dateTimeRangr.timezone = dtr.timezone;

        DateTimeRangeService.dateTimeRangr.dates = this.getRangeByLabel(dtr.title) || dtr.dates;
        this._sss.saveDateTimeRange({
            title: DateTimeRangeService.dateTimeRangr.title,
            timezone: DateTimeRangeService.dateTimeRangr.timezone,
            dates: DateTimeRangeService.dateTimeRangr.dates
        });
        this.refresh();
    }
}
