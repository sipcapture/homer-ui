import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceMapping, ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { Observable } from 'rxjs';
import { DateTimeRangeService } from './data-time-range.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    currentQuery: any;
    isLoki = false;
    location: any;
    protocol: any;
    search: any;
    target: any;

    constructor (
        private _dtrs: DateTimeRangeService
    ) {
        this.currentQuery = this.getLocalStorageQuery() || {
            protocol_id: null,
            location: {}
        };
        this.protocol = this.currentQuery.protocol_id;

        if (!this.protocol) {
            console.error('this.protocol is undefined')
        }
    }

    public setLocalStorageQuery(query: any) {
        this.currentQuery = Functions.cloneObject(query);
        localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(query));
    }

    public getLocalStorageQuery() {
        const localData = this.currentQuery ? this.currentQuery : JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY));
        return localData;
    }

    public setTypeIsLoki(bool: boolean) {
        this.isLoki = bool;
    }

    public setQueryLocation(location: any){
        this.location = location;
    }

    public setQueryProtocolId(protocol: any) {
        this.protocol = protocol;
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

    private getTransactionFlags () {
        return {
            call: this.currentQuery.protocol_id === '1_call',
            registration: this.currentQuery.protocol_id === '1_registration',
            rest: this.currentQuery.protocol_id === '1_default'
        };
    }

    private getLocation() {
        const localData = this.currentQuery;
        const locationArray = {};
        if (localData.location && localData.location.value !== '' && localData.location.mapping !== '') {
            locationArray[localData.location.mapping] = localData.location.value;
        }
        return locationArray;
    }

    public queryBuilderQOS (row: any, selectedCallId: any) { /** search-grid-call */
        console.log('searchServise:: public queryBuilderQOS()');
        const labels = selectedCallId;

        const localData = this.currentQuery;

        const search = {};
        search[localData.protocol_id] = {
            id: row.data.id * 1,
            callid: labels.length > 0 ? labels : [row.data.callid],
            uuid: []
        };

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                search: search,
                location: this.getLocation(),
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal()
            }
        };
    }
    getQueryFull(id, callid, selectedCallId) {
        const labels = selectedCallId;

        const localData = this.currentQuery;

        const search = {};
        search[localData.protocol_id] = {
            id: id * 1,
            callid: labels.length > 0 ? labels : [callid],
            uuid: []
        };

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                search: search,
                location: this.getLocation(),
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal()
            }
        };
    }

    public queryBuilder_EXPORT (id, callid) {
        console.log('searchServise:: public queryBuilder_EXPORT()');
        const localData = this.currentQuery;

        const search = {};
        search[localData.protocol_id] = {
            id: id,
            callid: [callid],
            uuid: []
        };

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                search: search,
                location:  this.getLocation(),
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal()
            }
        };
    }
}
