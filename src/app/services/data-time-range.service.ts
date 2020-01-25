import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import { SessionStorageService, UserSettings } from './session-storage.service';


export interface DateTimeTick {
    _id?: number;
    range: {
        title: string;
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
                    DateTimeRangeService.dateTimeRangr.dates = data.dateTimeRange.dates.map(i => moment(i));
                }
            }
        });
    }
    /**
     * Set delay ro auto refresh
     * @param delay number of milliseconds
     */
    setDelay (delay: number) {
        this.delayRefresher = delay;
        if (this._interval) {
            clearInterval(this._interval);
        }
        // if delay === 0, then is no refrash
        if (delay === 0) {
            return;
        }

        this._interval = setInterval(this.refrash.bind(this), this.delayRefresher);
    }
    refrash() {
        DateTimeRangeService.dateTimeRangr.dates =
            this.getRangeByLabel(DateTimeRangeService.dateTimeRangr.title) ||
            DateTimeRangeService.dateTimeRangr.dates;

        this.rangeUpdateTimeout.next({
            _id: Date.now(),
            range: DateTimeRangeService.dateTimeRangr
        });
    }
    getDatesForQuery(isUnixFormat = false): Timestamp {
        const _dates = (this.getRangeByLabel(DateTimeRangeService.dateTimeRangr.title) ||
            DateTimeRangeService.dateTimeRangr.dates).map(d => {
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

    getRangeByLabel(label: string, isAll = false) {
        const arr = {
            'Today': [moment().startOf('day'), moment().endOf('day')],
                        'Last 5 minutes': [moment().subtract(5, 'minutes'), moment()],
            'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
                        'Last 15 minutes': [moment().subtract(15, 'minutes'), moment()],
            'Tomorrow': [moment().add(1, 'days').startOf('day'), moment().add(1, 'days').endOf('day')],
                        'Last 30 minutes': [moment().subtract(30, 'minutes'), moment()],
            'Last 7 days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
                        'Last 1 Hour': [moment().subtract(1, 'hour'), moment()],
            'Last 15 days': [moment().subtract(15, 'days').startOf('day'), moment().endOf('day')],
                        'Last 3 hours': [moment().subtract(3, 'hours'), moment()],
            'Last 30 days': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
                        'Last 6 hours': [moment().subtract(6, 'hours'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
                        'Last 12 hours': [moment().subtract(12, 'hours'), moment()],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                        'Last 24 hours': [moment().subtract(24, 'hours'), moment()],
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

        DateTimeRangeService.dateTimeRangr.dates = this.getRangeByLabel(dtr.title) || dtr.dates;
        this._sss.saveDateTimeRange({
            title: DateTimeRangeService.dateTimeRangr.title,
            dates: DateTimeRangeService.dateTimeRangr.dates
        });
        this.refrash();
    }
}
