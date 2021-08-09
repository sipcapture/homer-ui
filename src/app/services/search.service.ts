import { BehaviorSubject, Observable } from 'rxjs';
import { SessionStorageService } from './session-storage.service';
import { DashboardService } from './dashboard.service';
import { Injectable } from '@angular/core';
import { ConstValue, UserConstValue } from '@app/models';
import { Functions, setStorage } from '@app/helpers/functions';

import { DateTimeRangeService } from './data-time-range.service';
import { AlertService } from './alert.service';
import { TranslateService } from '@ngx-translate/core';

enum DEFAULT_VALIE {
    protocol_id = '60_call_h20'
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    static currentQuery: any;
    isLoki = false;
    location: any;
    protocol: any;
    search: any;
    target: any;
    private _behavior: BehaviorSubject<any> = new BehaviorSubject<any>({});
    constructor(
        private dateTimeRangeService: DateTimeRangeService,
        private alertService: AlertService,
        private dashboardService: DashboardService,
        private sessionStorageService: SessionStorageService,
        private translateService: TranslateService
    ) {
        this.Init();
    }

    private Init() {
        const params = Functions.getUriJson();

        SearchService.currentQuery = this.getLocalStorageQuery() || {
            protocol_id: DEFAULT_VALIE.protocol_id,
            location: this.location
        };
        if (params && params.param && params.param.search) {
            this.protocol = SearchService.currentQuery.protocol_id = Object.keys(params.param.search).find(i => !!i);
            this.location = SearchService.currentQuery.location = params.param.location;
            if (params && params.timestamp) {
                const { from, to } = params.timestamp;
                const format = d => new Date(d).toLocaleString().split(',').map(i => i.replace(/\./g, '/')).join('');
                this.dateTimeRangeService.updateDataRange({
                    title: [
                        format(from),
                        format(to)
                    ].join(' - '),
                    dates: [
                        new Date(from).toISOString(),
                        new Date(to).toISOString()
                    ]
                });
            }
        } else {
            this.protocol = SearchService.currentQuery.protocol_id || this.protocol;
            this.location = SearchService.currentQuery.location || this.location;
        }
    }
    public setLocalStorageQuery(query: any = null) {
        if (!query && !SearchService.currentQuery) {
            console.error(new Error('setLocalStorageQuery'));
            return;
        }
        if (query) {
            SearchService.currentQuery = Functions.cloneObject(query);
        }
        if (SearchService.currentQuery.location) {
            this.location = SearchService.currentQuery.location;
        } else {
            SearchService.currentQuery.location = this.location || SearchService.currentQuery.location;
        }
        if (SearchService.currentQuery.protocol_id) {
            this.protocol = SearchService.currentQuery.protocol_id;
        } else {
            SearchService.currentQuery.protocol_id = this.protocol || SearchService.currentQuery.protocol_id;
            if (!SearchService.currentQuery.protocol_id) {
                this.translateService.get('notifications.error.mappingIssue').subscribe(res => { 
                    this.alertService.error(res);
                })
            }
        }

        this._behavior.next({});
        setStorage(UserConstValue.SEARCH_QUERY, SearchService.currentQuery);
        localStorage.removeItem(ConstValue.SEARCH_QUERY);
    }
    filterStatus(item) {
        if (item.name === 'status') {
            if (item.value !== 0 && item.value !== '0' && typeof item.value !== 'undefined' && item.value !== '' && item.value !== 'undefined') {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }
    public clearLocalStorageSEARCH_QUERY() {
        localStorage.removeItem(ConstValue.SEARCH_QUERY);
        localStorage.removeItem(ConstValue.SQWR);

        localStorage.removeItem(UserConstValue.SEARCH_QUERY);
        localStorage.removeItem(UserConstValue.SQWR);
        this.dashboardService.clearLocalStorage();
        this.sessionStorageService.clearLocalStorage();

        this.Init();
    }
    public getLocalStorageQuery(loadSettings?: boolean) {
        let localStorageData = '';
        try {
            localStorageData = Functions.JSON_parse(localStorage.getItem(UserConstValue.SEARCH_QUERY)) ||
            Functions.JSON_parse(localStorage.getItem(ConstValue.SEARCH_QUERY));
        } catch (err) {
            console.error(err);
        }
        if (localStorageData !== '') {
            SearchService.currentQuery = localStorageData || {
                protocol_id: SearchService.currentQuery?.protocol_id || DEFAULT_VALIE.protocol_id,
                location: this.location
            };
            const localData = Functions.cloneObject(SearchService.currentQuery);
            if (localData && localData.fields && localData.fields instanceof Array) {
                localData.fields = localData.fields.filter(i => i.name !== ConstValue.CONTAINER && this.filterStatus(i));
            }
            if (!loadSettings && localData.fields) {
                localData.fields.forEach(field => {
                    if (field.hasOwnProperty('func') && field.func !== null) {
                        let func = field.func.value.replace('::field::', field.name);
                        func = func.replace('::value::', field.value);
                        field.value = func;
                        delete field.func;
                    }
                });
            }
            return localData;
        } else {
            /** default */
            return {
                fields: [],
                protocol_id: DEFAULT_VALIE.protocol_id
            };
        }
    }

    public setTypeIsLoki(bool: boolean) {
        this.isLoki = bool;
    }

    public setQueryLocation(location: any) {
        SearchService.currentQuery.location = location;
    }

    public getQueryLocation() {
        return SearchService.currentQuery.location;
    }

    public setQueryProtocolId(protocol_id: any) {
        SearchService.currentQuery.protocol_id = protocol_id;
    }

    public getQueryProtocolId() {
        return SearchService.currentQuery.protocol_id;
    }

    public setQuerySearch(search: any) {
        this.search = search;
    }

    public setTargetContainer(target) {
        this.target = target;
    }

    public getTimeZoneLocal() {
        return {
            value: new Date().getTimezoneOffset(), // -120 min, when GMT+2
            name: 'Local'
        };
    }

    private getTransactionFlags() {
        const _ = name => SearchService.currentQuery.protocol_id.includes(name);
        return {
            call: _('call'),
            registration: _('registration'),
            rest: _('default')
        };
    }

    private getLocation(): any {
        const localData = SearchService.currentQuery;

        const locationArray = {};
        if (this.location) {
            localData.location = this.location;
        }

        if (localData.location && localData.location.value !== '' && localData.location.mapping !== '') {
            locationArray[localData.location.mapping] = localData.location.value;
        }
        return locationArray;
    }

    getQueryFull(id, callid, selectedCallId) {
        const labels = selectedCallId;

        const localData = SearchService.currentQuery;

        const search = {};
        search[localData.protocol_id] = {
            id: id * 1,
            callid: labels.length > 0 ? labels : [callid],
            uuid: []
        };
        return {
            timestamp: this.dateTimeRangeService.getDatesForQuery(true),
            param: {
                search: search,
                location: this.getLocation(),
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal()
            }
        };
    }

    public queryBuilder_EXPORT(id, callid, protocol_id = null) {

        const localData = SearchService.currentQuery;

        localData.protocol_id = protocol_id || localData.protocol_id;

        const search = {};
        search[localData.protocol_id] = {
            id: id,
            callid: callid,
            uuid: []
        };

        return {
            timestamp: this.dateTimeRangeService.getDatesForQuery(true),
            param: {
                search: search,
                location: this.getLocation() as any,
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal(),
                whitelist: []
            }
        };
    }

    public get event(): Observable<any> {
        return this._behavior.asObservable();
    }
}
