import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';
import { ConstValue } from '@app/models';


export interface UserSettings {
    updateType: string;
    dateTimeRange: {
        title: string;
        dates: [ moment.Moment, moment.Moment ]
    };
    protosearchSettings: any;
}

@Injectable({
    providedIn: 'root'
})

export class SessionStorageService {

    DATA_TIME_RANGE = 'data-time-range';
    FULL = 'full';
    PROTO_SEARCH = 'proto-search';
    USER_SETTINGS = 'user-settings';

    private localUserSettings: BehaviorSubject<any>;
    private userSettings: UserSettings = {
        updateType: this.FULL,
        dateTimeRange: {
            title: '',
            dates: [moment(), moment()]
        },
        protosearchSettings: {}
    };

    public sessionStorage: Observable<any>;

    constructor(private authenticationService: AuthenticationService) {
        this.authenticationService.currentUser.subscribe(currentUser => {
            if (currentUser) {
                this.userSettings = JSON.parse(localStorage.getItem(this.USER_SETTINGS)) || this.userSettings;
                if (this.userSettings.protosearchSettings instanceof Array) {
                    this.userSettings.protosearchSettings = {};
                }
                if (!this.userSettings.updateType || this.userSettings.updateType === this.PROTO_SEARCH) {
                    this.userSettings.updateType = this.FULL;
                }
                this.localUserSettings = new BehaviorSubject<any>(this.userSettings);
                this.sessionStorage = this.localUserSettings.asObservable();
            }
        });
    }

    saveDateTimeRange(dtr: any) {
        this.userSettings.dateTimeRange = dtr;
        this.saveUserData(this.DATA_TIME_RANGE);
    }
    public getDateTimeRange() {
        return this.userSettings.dateTimeRange;
    }
    private saveUserData(updateType = this.FULL) {
        Object.keys(this.userSettings.protosearchSettings).forEach(widgetId => {
            if (!this.userSettings.protosearchSettings[widgetId] ||
                this.userSettings.protosearchSettings[widgetId].hasOwnProperty(ConstValue.serverLoki)) {
                return;
            }
            const fields = this.userSettings.protosearchSettings[widgetId].fields;
            if (fields && fields.length === 0) {
                delete this.userSettings.protosearchSettings[widgetId];
            }
        });
        this.userSettings.updateType = updateType;
        this.localUserSettings.next(this.userSettings);
        this.userSettings.updateType = this.FULL;
        localStorage.setItem(this.USER_SETTINGS, JSON.stringify(this.userSettings));
    }
    removeProtoSearchConfig(widgetId: string) {
        delete this.userSettings.protosearchSettings[widgetId];
        this.saveUserData(this.PROTO_SEARCH);
    }
    saveProtoSearchConfig(widgetId: string, fieldsValue: any) {
        this.userSettings.protosearchSettings[widgetId] = fieldsValue;
        this.saveUserData(this.PROTO_SEARCH);
    }


}
