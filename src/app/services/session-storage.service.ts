import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';
import { ConstValue } from '@app/models';


export interface UserSettings {
    updateType: string;
    dateTimeRange: {
        title: string;
        timezone: string;
        dates: [ moment.Moment, moment.Moment ]
    };
    protosearchSettings: any;
}

@Injectable({
    providedIn: 'root'
})

export class SessionStorageService {
    static userSettings: UserSettings = {
        updateType: 'full',
        dateTimeRange: {
            title: '',
            timezone: '',
            dates: [moment(), moment()]
        },
        protosearchSettings: {}
    };

    DATA_TIME_RANGE = 'data-time-range';
    FULL = 'full';
    PROTO_SEARCH = 'proto-search';
    USER_SETTINGS = 'user-settings';
    SEARCH_QUERY = 'searchQuery';

    private localUserSettings: BehaviorSubject<any>;

    public sessionStorage: Observable<any>;

    constructor(private authenticationService: AuthenticationService) {
        this.updateDataFromLocalStorage();
    }
    updateDataFromLocalStorage () {
        this.authenticationService.currentUser.subscribe(currentUser => {
            if (currentUser) {
                SessionStorageService.userSettings = JSON.parse(localStorage.getItem(this.USER_SETTINGS)) ||
                    SessionStorageService.userSettings;

                if (SessionStorageService.userSettings.protosearchSettings instanceof Array) {
                    SessionStorageService.userSettings.protosearchSettings = {};
                }
                if (!SessionStorageService.userSettings.updateType || SessionStorageService.userSettings.updateType === this.PROTO_SEARCH) {
                    SessionStorageService.userSettings.updateType = this.FULL;
                }
                this.localUserSettings = new BehaviorSubject<any>(SessionStorageService.userSettings);
                this.sessionStorage = this.localUserSettings.asObservable();
            }
        });
    }
    public clearLocalStorage () {
        SessionStorageService.userSettings = {
            updateType: this.FULL,
            dateTimeRange: {
                title: '',
                timezone: '',
                dates: [moment(), moment()]
            },
            protosearchSettings: {}
        };
    }
    saveDateTimeRange(dtr: any) {
        SessionStorageService.userSettings.dateTimeRange = dtr;
        this.saveUserData(this.DATA_TIME_RANGE);
    }
    public getDateTimeRange() {
        return SessionStorageService.userSettings.dateTimeRange;
    }
    private saveUserData(updateType = this.FULL) {
        Object.keys(SessionStorageService.userSettings.protosearchSettings).forEach(widgetId => {
            if (!SessionStorageService.userSettings.protosearchSettings[widgetId] ||
                SessionStorageService.userSettings.protosearchSettings[widgetId].hasOwnProperty(ConstValue.serverLoki)) {
                return;
            }
            const fields = SessionStorageService.userSettings.protosearchSettings[widgetId].fields;
            if (fields && fields.length === 0) {
                delete SessionStorageService.userSettings.protosearchSettings[widgetId];
            }
        });
        SessionStorageService.userSettings.updateType = updateType;
        this.localUserSettings.next(SessionStorageService.userSettings);
        SessionStorageService.userSettings.updateType = this.FULL;
        localStorage.setItem(this.USER_SETTINGS, JSON.stringify(SessionStorageService.userSettings));
    }
    removeProtoSearchConfig(widgetId: string) {
        delete SessionStorageService.userSettings.protosearchSettings[widgetId];
        this.saveUserData(this.PROTO_SEARCH);
    }
    saveProtoSearchConfig(widgetId: string, fieldsValue: any) {
        SessionStorageService.userSettings.protosearchSettings[widgetId] = fieldsValue;
        this.saveUserData(this.PROTO_SEARCH);
    }
    async getLocalData(item) {
        return await JSON.parse(localStorage.getItem(item))
    }

}
