import { Injectable } from '@angular/core';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';

import { DateTimeRangeService } from './data-time-range.service';
import { AlertService } from './alert.service';


@Injectable({
    providedIn: 'root'
})
export class SearchService {
    static currentQuery: any = {};
    cached = {}
    isLoki = false;
    location: any;
    protocol: any;
    search: any;
    target: any;
    cachedQuery = {}
    constructor (
        private dateTimeRangeService: DateTimeRangeService,
        private alertService: AlertService,
    ) {
        const params = Functions.getUriJson();

        SearchService.currentQuery = this.getLocalStorageQuery() || {
            protocol_id: this.cachedQuery['protocol_id'] || null,
            location: this.location
        }; 
        this.cached = SearchService.currentQuery
        if (params && params.param && params.param.search) {
            this.protocol = SearchService.currentQuery.protocol_id = Object.keys(params.param.search)[0];
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

    public getCachedQuery(query){
    this.cachedQuery = query;
    }
    public setLocalStorageQuery(query: any) {
        SearchService.currentQuery = Functions.cloneObject(query);
        if (query.location) {
            this.location = query.location;
        } else {
            SearchService.currentQuery.location = this.location || SearchService.currentQuery.location;
        }
        if (query.protocol_id) {
            this.protocol = query.protocol_id;
        } else {
            SearchService.currentQuery.protocol_id = this.protocol || SearchService.currentQuery.protocol_id;
            if (!SearchService.currentQuery.protocol_id) {
                this.alertService.error(`couldn't retrieve the correct settings for this mapping`);
            }
        }
        localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(SearchService.currentQuery));
    }
    public getLocalStorageQuery() {
        SearchService.currentQuery = JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY)) || {
            protocol_id: SearchService.currentQuery.protocol_id,
            location: this.location
        };

        const localData = Functions.cloneObject(SearchService.currentQuery);
        if (localData && localData.fields && localData.fields instanceof Array) {
            localData.fields = localData.fields.filter(i => i.name !== ConstValue.CONTAINER);
        }
        return localData;
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

    private getTransactionFlags () {
        return {
            call: SearchService.currentQuery.protocol_id.includes('call'),
            registration: SearchService.currentQuery.protocol_id.includes('registration'),
            rest: SearchService.currentQuery.protocol_id.includes('default')
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

    public queryBuilderQOS (row: any, selectedCallId: any, timestamp: any) { /** search-grid-call */

        const labels = selectedCallId;

        const localData = SearchService.currentQuery;

        const search = {};
        search[localData.protocol_id] = {
            id: row.data.id * 1,
            callid: labels.length > 0 ? labels : [row.data.callid],
            uuid: []
        };

        const dbnode = this.getLocation();
        if (row && row.data && row.data.dbnode && dbnode.node) {
            dbnode.node = [row.data.dbnode];
        }
        return {
            timestamp: timestamp,
            param: {
                search: search,
                location: dbnode,
                transaction: this.getTransactionFlags(),
                id: {},
                timezone: this.getTimeZoneLocal()
            }
        };
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

    public queryBuilder_EXPORT (id, callid, protocol_id = null) {
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
                timezone: this.getTimeZoneLocal()
            }
        };
    }
}
