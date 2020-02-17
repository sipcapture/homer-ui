import { Injectable } from '@angular/core';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';

import { DateTimeRangeService } from './data-time-range.service';
import { AlertService } from './alert.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    currentQuery: any = {};
    isLoki = false;
    location: any;
    protocol: any;
    search: any;
    target: any;

    constructor (
        private _dtrs: DateTimeRangeService,
        private alertService: AlertService
    ) {
        this.currentQuery = this.getLocalStorageQuery() || {
            protocol_id: null,
            location: this.location
        };
        this.protocol = this.currentQuery.protocol_id || this.protocol;
        this.location = this.currentQuery.location || this.location;
    }

    public setLocalStorageQuery(query: any) {
        if (query.location) {
            this.location = query.location;
        } else {
            this.currentQuery.location = this.location;
        }
        if (query.protocol) {
            this.protocol = query.protocol;
        } else {
            this.currentQuery.protocol = this.protocol;
            if (this.currentQuery.protocol) {
                this.alertService.error('./homer-app -populate-table-db-config -force-populate  -populate-table=mapping_schema')
            }
        }
        this.currentQuery = Functions.cloneObject(query);
        localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(query));
    }

    public getLocalStorageQuery() {
        this.currentQuery = JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY)) || {
            protocol_id: null,
            location: this.location
        };

        const localData = Functions.cloneObject(this.currentQuery);
        if (localData && localData.fields && localData.fields instanceof Array) {
            localData.fields = localData.fields.filter(i => i.name !== ConstValue.CONTAINER);
        }
        return localData;
    }

    public setTypeIsLoki(bool: boolean) {
        this.isLoki = bool;
    }

    public setQueryLocation(location: any) {
        this.location = location;
    }

    public getQueryLocation() {
        return this.location;
    }

    public setQueryProtocolId(protocol: any) {
        this.protocol = protocol;
    }

    public getQueryProtocolId() {
        return this.protocol;
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

    private getLocation(): any {
        const localData = this.currentQuery;

        const locationArray = {};
        if (this.location) {
            localData.location = this.location;
        }

        if (localData.location && localData.location.value !== '' && localData.location.mapping !== '') {
            locationArray[localData.location.mapping] = localData.location.value;
        }
        return locationArray;
    }

    public queryBuilderQOS (row: any, selectedCallId: any) { /** search-grid-call */

        const labels = selectedCallId;

        const localData = this.currentQuery;

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
            timestamp: this._dtrs.getDatesForQuery(true),
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

    public queryBuilder_EXPORT (id, callid, protocol_id = null) {
        const localData = this.currentQuery;

        localData.protocol_id = protocol_id || localData.protocol_id;

        const search = {};
        search[localData.protocol_id] = {
            id: id,
            callid: callid,
            uuid: []
        };

        return {
            timestamp: this._dtrs.getDatesForQuery(true),
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
