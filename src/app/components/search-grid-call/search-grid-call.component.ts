import { GridOptions } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { Functions } from '@app/helpers/functions';
import * as moment from 'moment';
import { ConstValue } from '@app/models';
import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ChangeDetectorRef,
    Input,
    HostListener
} from '@angular/core';
import {
    ColumnActionRenderer,
    ColumnCallidRenderer,
    ColumnMethodRenderer,
    HeaderActionRenderer,
    LokiHighlightRenderer
} from './renderer';
import {
    SearchCallService,
    DashboardService,
    SearchRemoteService,
    CallTransactionService,
    DateTimeRangeService,
    PreferenceMappingProtocolService,
    PreferenceUserSettingsService,
    CallReportService,
    SearchService,
    PreferenceAdvancedService
} from '@app/services';


@Component({
    selector: 'app-search-grid-call',
    templateUrl: './search-grid-call.component.html',
    styleUrls: ['./search-grid-call.component.css']
})
export class SearchGridCallComponent implements OnInit, OnDestroy, AfterViewInit {
    private gridApi;
    private gridColumnApi;
    public context;
    public frameworkComponents;
    @Input() inContainer = false;
    @Input() id: string = null;
    filterGridValue: string;
    defaultColDef: Object;
    columnDefs: Array<Object>;
    myPredefColumns: Array<Object>;
    rowData: Object;
    showPortal = false;
    private isOpenDialog = false;
    title = 'Call Result';
    isLoading = false;
    activeRow = '';
    comingRequest: any = null;
    arrWindow: Array<any> = [];
    arrMessageDetail: Array<any> = [];
    searchQueryLoki: any;

    isLokiQuery = false;
    lastTimestamp: number;
    localData: any;
    queryTextLoki: string;

    gridOptions: GridOptions = <GridOptions> {
        defaultColDef: {
            sortable: true,
            resizable: true
        },
        rowHeight: 38,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        getRowStyle: this.getBkgColorTable.bind(this),
        suppressCellSelection: true
    };
    protocol_profile: string;
    config: any = {
        param: {
            transaction: {},
            limit: 200,
            search: {},
            location: {},
            timezone: {
                value: -180,
                name: 'Local'
            }
        },
        timestamp: { from: 0, to: 0 }
    };

    private limitRange: any = {
        from: -300000, // - 5min
        to: 600000, // + 10min
        message_from: -1000, // - 1sec
        message_to: 1000, // + 1sec
    };

    private _interval: any;
    private subscriptionRangeUpdateTimeout: Subscription;
    public subscriptionDashboardEvent: Subscription;
    private _latestQuery: string;

    constructor(
        private _puss: PreferenceUserSettingsService,
        private _scs: SearchCallService,
        private _srs: SearchRemoteService,
        private _pmps: PreferenceMappingProtocolService,
        private _ers: CallReportService,
        private _cts: CallTransactionService,
        private _dtrs: DateTimeRangeService,
        private _ds: DashboardService,
        private _pas: PreferenceAdvancedService,
        private changeDetectorRefs: ChangeDetectorRef,
        private searchService: SearchService
    ) {
        this.myPredefColumns = [{
            headerName: '',
            field: '',
            minWidth: 60,
            maxWidth: 60,
            // cellRenderer: 'columnActionRenderer',
            checkboxSelection: true,
            lockPosition: true,
            cellRendererParams: { checkbox: true },
            pinned: 'left',
            cellClass: 'no-border',
            headerComponentFramework: HeaderActionRenderer
        }];

        this.context = { componentParent: this };
        this.frameworkComponents = {
            columnActionRenderer: ColumnActionRenderer,
            columnCallidRenderer: ColumnCallidRenderer,
            columnMethodRenderer: ColumnMethodRenderer,
            LokiHighlightRenderer: LokiHighlightRenderer
        };
    }

    @HostListener('window:resize')
    onResize() {
        if (!this.gridApi) {
            return;
        }

        setTimeout(() => {
            this.gridApi.sizeColumnsToFit();
        }, 300);
    }

    ngOnInit() {
        if (this.inContainer) {
            this.subscriptionDashboardEvent = this._ds.dashboardEvent.subscribe(data => {
                const dataId = data.resultWidget[this.id];
                if (dataId && this.lastTimestamp !== dataId.timestamp) {
                    this.localData = dataId.query;
                    this.protocol_profile = this.localData.protocol_id;

                    this.lastTimestamp = dataId.timestamp;

                    if (this.protocol_profile === ConstValue.LOKI_PREFIX ) {
                        this.queryTextLoki = dataId.query.text;
                        this.isLokiQuery = true;
                    } else {
                        this.isLokiQuery = false;
                    }
                    this.config.param.search[this.protocol_profile] = this.localData.fields;

                    if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
                        this.config.param.location[this.localData.location.mapping] = this.localData.location.value;
                    }

                    if (!this.subscriptionRangeUpdateTimeout) {
                        this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(() => {
                            this.update();
                        });
                    }
                }
            });
        } else {
            setTimeout(() => { /** <== fixing ExpressionChangedAfterItHasBeenCheckedError */
                /**
                 * update DateTimeRange from GET params
                 */
                const params = Functions.getUriJson();
                if (params && params.timestamp) {
                    const { from, to } = params.timestamp;
                    const format = d => new Date(d).toLocaleString().split(',').map(i => i.replace(/\./g, '/')).join('');
                    this._dtrs.updateDataRange({
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
            });
            if (!this.subscriptionRangeUpdateTimeout) {
                this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(() => {
                    this.update(true);
                });
            }
            this.getHeaders();
        }

        this._puss.getAll().toPromise().then((result: any) => {
            const d = result.data.filter(i => i.param === 'transaction:range')[0];
            if (d && d.data) {
                this.limitRange.from = d.data.from || -300000;
                this.limitRange.to = d.data.to || 600000;
                this.limitRange.message_from = d.data.message_from || -1000;
                this.limitRange.message_to = d.data.message_to || 1000;
            }
        });
    }

    // get

    private getQueryData() {
        if (!this.id) {
            const params = Functions.getUriJson();

            if (params && params.param) {
                /**
                 * query configuration from GET params
                 */
                this.localData = params.param;
                this.protocol_profile = Object.keys(params.param.search)[0];
                this.config.param = Functions.cloneObject(params.param);

                if (params.param.search &&
                    params.param.search[this.protocol_profile] &&
                    params.param.search[this.protocol_profile].callid
                ) {
                    const callid: Array<string>  = params.param.search[this.protocol_profile].callid;
                    this.config.param.search[this.protocol_profile] = [{
                        name: 'sid',
                        value: callid.join(';'),
                        type: 'string',
                        hepid: 1
                    }];
                } else {
                    this.config.param.search[this.protocol_profile] = [];
                }
                this.config.param.transaction = {};
                this.config.param.limit = 200;
                delete this.config.param.id;
                this.isLokiQuery = false;
            } else {
                this.localData = this.searchService.getLocalStorageQuery();


                this.protocol_profile = this.localData.protocol_id;

                if (this.protocol_profile === ConstValue.LOKI_PREFIX) {
                    this.isLokiQuery = true;
                    this.queryTextLoki = this.localData.text;
                } else {
                    this.isLokiQuery = false;
                }
                this.config.param.search[this.protocol_profile] = this.localData.fields;

                if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
                    this.config.param.location[this.localData.location.mapping] = this.localData.location.value;
                }
            }
        }

        if (this.comingRequest) {
            this.protocol_profile = this.comingRequest.protocol_id;
            this.config.param.search[this.comingRequest.protocol_id] = this.comingRequest.fields;

            if (this.comingRequest.location && this.comingRequest.location.value !== '' && this.comingRequest.location.mapping !== '') {
                this.config.param.location[this.comingRequest.location.mapping] = this.comingRequest.location.value;
            }
        }
    }

    public onUpdateQueryLoki(event) {
        this.searchQueryLoki = event;
        this.searchQueryLoki.limit = this.localData.limit * 1 || 100;
        this.searchQueryLoki.protocol_id = ConstValue.LOKI_PREFIX;
        this.searchQueryLoki.fields = [];

        this.searchService.setLocalStorageQuery(this.searchQueryLoki);
    }
    private queryBuilderForLoki() {
        if (!this.localData) {
            return null;
        }
        return {
            param: {
                server: this.localData.serverLoki, // 'http://127.0.0.1:3100',
                limit: this.localData.limit * 1 || 100,
                search: this.localData.text,
                timezone: this.searchService.getTimeZoneLocal()
            },
            timestamp: this._dtrs.getDatesForQuery(true)
        };
    }
    private selectCallIdFromGetParams() {
        const params = Functions.getUriJson();

        if (params && params.param) {
            
            const callid: Array<string>  = params.param.search[this.protocol_profile].callid;
            if (callid.length > 1) {
                this.gridApi.forEachLeafNode(node => {
                    if (callid.indexOf(node.data.callid) !== -1) {
                        node.setSelected(true, true);
                        
                    }
                });

            } else if (callid.length === 1) {
                /** under construction */
            } else {
                /** under construction */
            }
        }
    }
    private openTransactionByAdvencedSettings() {
        const params = Functions.getUriJson();
        if (params && params.param && !this.isOpenDialog) {
            this.isOpenDialog = true;
            this._pas.getAll().toPromise().then(advenced => {
                if (advenced && advenced.data) {
                    try {
                        const setting = advenced.data.filter(i => i.category === 'export' && i.param === 'transaction');
                        if (setting && setting[0] && setting[0].data) {
                            const { openwindow } = setting[0].data;
                            if (openwindow === true) {
                                const callid = params.param.search[this.protocol_profile].callid;
                                const rowData: Array<any>  = Functions.cloneObject(this.rowData) as Array<any>;

                                this.openTransactionDialog({
                                    data: callid.map(j => rowData.filter(i => i.callid === j)[0])[0]
                                }, null, callid);
                            }
                        }
                    } catch (err) { }
                }
            });
        }
    }
    private getHeaders() {
        this.columnDefs = [];
        this.config.timestamp = this._dtrs.getDatesForQuery(true);

        this.getQueryData();

        /* this is normaly not needed - just a workaround to copy from search param */
        for (const item in this.config.param.search) {
            if ((this.config.param as Object).hasOwnProperty(item)) {
                const elem = this.config.param.search[item];
                if (elem.filter(it => it.name === ConstValue.LIMIT).length > 1) {
                    this.config.param.limit = parseInt(elem.filter(it => it.name === ConstValue.LIMIT)[0].value, 10);
                }
            }
        }

        let marData = [];
        let hepVersion = 0;
        this._pmps.getAll().toPromise().then((data: any) => {

            const arrData: Array<any> = data.data;
            arrData.forEach((a: any) => {
                const keyHep = a.hepid + '_' + a.profile;

                if (marData.length === 0 && this.config.param.search && this.config.param.search.hasOwnProperty(keyHep)) {
                    marData = a.fields_mapping;
                    hepVersion = parseInt(a.hepid + '', 10);
                }
            });

            if (marData.length > 0) {
                const myRemoteColumns = [];
                /* dont add create date  */
                if (hepVersion < 2000) {
                    myRemoteColumns.push({ headerName: 'ID', field: 'id', minWidth: 20, maxWidth: 40, hide: true});
                    myRemoteColumns.push({ headerName: 'Date', field: 'create_date', filter: true, suppressSizeToFit: true,
                        valueFormatter: (item: any) => item.value ? moment(item.value).format('YYYY-MM-DD HH:mm:ss.SSS') : null});
                }
                for (const h of marData) {
                    const idArray = h.id.split('.');
                    const idColumn: any = idArray[idArray.length - 1];

                    /* skip if skip == true */
                    if (idColumn === 'raw' || idColumn === ConstValue.LIMIT || (h.hasOwnProperty('skip') && h.skip === true)) {
                        continue;
                    }

                    /* default column values */
                    const vaColumn: any =  { headerName: h.name, field: idColumn, filter: true, resizable: true};
                    if (idColumn === 'sid' || idColumn === 'callid' || (h.hasOwnProperty('sid_type') && h.sid_type === true)) {
                        vaColumn.cellStyle = this.getCallIDColor.bind(this);
                        vaColumn.cellRenderer = 'columnCallidRenderer';
                    }
                    if (idColumn === 'custom_1') { /** Loki column 'Message' */
                        vaColumn.cellRenderer = 'LokiHighlightRenderer';
                    }
                    if (idColumn === 'method' || (h.hasOwnProperty('method_type') && h.method_type === true)) {
                        vaColumn.cellRenderer = 'columnMethodRenderer';
                        vaColumn.cellStyle = this.getMethodColor.bind(this);
                    }
                    if ((h.hasOwnProperty('date_field') && h.date_field === true)) {
                        vaColumn.valueFormatter =
                            (item: any) => item.value ? moment(item.value).format('YYYY-MM-DD HH:mm:ss.SSS') : null;
                    }
                    if (h.hasOwnProperty('hide') && h.hide === true) {
                        vaColumn.hide = true;
                    }
                    if (h.hasOwnProperty('suppressSizeToFit') && h.suppressSizeToFit === true) {
                        vaColumn.suppressSizeToFit = true;
                    }
                    if (h.hasOwnProperty('autoheight') && h.autoheight === true) {
                        vaColumn.cellStyle = {
                            'white-space': 'normal',
                            'line-height': '1.5rem'
                        };
                        vaColumn.autoHeight = true;
                    }
                    myRemoteColumns.push(vaColumn);
                }
                // this.columnDefs = hepVersion < 2000 ? this.myPredefColumns.concat(myRemoteColumns) : myRemoteColumns;
                this.columnDefs = this.localStateHeaders(hepVersion < 2000 ?
                    this.myPredefColumns.concat(myRemoteColumns) : myRemoteColumns);
                this.sizeToFit();
            }
        });
    }

    private localStateHeaders(apiColumn) {
        let lsIndex = 'result-state';
        if ( this.id ) {
            lsIndex += `-${this.id}`;
        }
        let h: any = localStorage.getItem(lsIndex);
        if (h) {
            h = JSON.parse(h);

            apiColumn.forEach(col => {
                const f = h.filter(i => i.field === col.field)[0];
                if (f) {
                    col.hide = !f.selected;
                }
            });
        }
        return apiColumn;
    }

    private isNewData(): boolean {
        const _md5 = Functions.md5(
            JSON.stringify(this.queryBuilderForLoki()) +
            JSON.stringify(this.isLokiQuery) +
            JSON.stringify(this._dtrs.getDatesForQuery(true)) +
            JSON.stringify(this.config) +
            JSON.stringify(this.searchQueryLoki)
        );
        const bool = this._latestQuery === _md5;
        if (!bool) {
            this._latestQuery = _md5;
        }
        return bool;

    }

    public update(isImportant = false) {
        if (this.isNewData() && !isImportant) {
            return;
        }
        this.config.timestamp = this._dtrs.getDatesForQuery(true);

        if (this.inContainer) { /* if ag-grid in result widget */
            this.getHeaders();
        } else {
            this.getQueryData();
        }

        if ( this.isLokiQuery ) {
            this._srs.getData(this.queryBuilderForLoki()).toPromise().then(result => {
                this.rowData = result.data;
                this.sizeToFit();
                setTimeout(() => { /** for grid updated autoHeight and sizeToFit */
                    this.rowData = Functions.cloneObject(this.rowData);
                }, 600);
            });
        } else {
            this._scs.getData(this.config).toPromise().then(result => {
                this.rowData = result.data;
                this.sizeToFit();
                this.selectCallIdFromGetParams();
                this.openTransactionByAdvencedSettings();
            });
        }
    }

    ngAfterViewInit () {
        window.document.body.addEventListener('mouseup', this.onSizeToFit.bind(this));
    }

    onSizeToFit () {
        if (!this.gridApi) {
            return;
        }
        this.sizeToFit();
    }

    private hashCode(str) {
        let hash = 0;
        if (str) {
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        return hash;
    }

    private intToARGB(i) {
        return ((i >> 24) & 0xFF);
    }

    private getCallIDColor (params) {
        return (!params.hasOwnProperty('value') ||
            (typeof params.value === 'undefined')) ?  {} :
                {'color': Functions.getColorByString(params.value)};
    }

    private getMethodColor (params) {
        return (!params.hasOwnProperty('value') ||
            (typeof params.value === 'undefined')) ?  {} :
                {'color': Functions.getColorByString(params.value)};
    }

    private getBkgColorTable(params) {
        if (this.isLokiQuery) {
            return {
                'background-color': '#fff'
            }
        }
        const callid = params.data.callid;
        const his = this.hashCode(callid);
        const color = 'hsla(' + this.intToARGB(his) + ', 75%, 85%, 0.3)';
        return {
            'background-color': color
        };
    }

    private sizeToFit() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        this._interval = setTimeout(() => {
            if (this.gridApi) {
                this.gridApi.sizeColumnsToFit();
            }
        }, 300);
    }

    private setQuickFilter() {
        this.gridApi.setQuickFilter(this.filterGridValue);
    }
    public onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
    }

    public openTransactionForSelectedRows(index, row, mouseEventData = null) {
        const data = {data: row};
        this.openTransactionDialog(data, mouseEventData);
    }

    public openMethodForSelectedRow(index, row, mouseEventData = null ) {
        const data = {data: row};
        this.addWindowMessage(data, mouseEventData);
    }

    public openTransactionDialog (row, mouseEventData = null, callisArray = null) {
        // do not open duplicate window
        if ((this.arrWindow.filter(i => i.id === row.data.callid)[0] != null)) {
            return;
        }

        const selectedRows = this.gridApi.getSelectedRows();

        /* clear from clones */
        const selectedCallId = callisArray || selectedRows.map(i => i.callid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);

        const color = Functions.getColorByString(row.data.callid);

        const request = {
            param: Functions.cloneObject(this.config.param || {} as any),
            timestamp: {
                from: row.data.create_date + this.limitRange.from,
                to: row.data.create_date + this.limitRange.to
            }
        };

        request.param.search[this.protocol_profile] = {
            id: row.data.id,
            callid: selectedCallId.length > 0 ? selectedCallId : [row.data.callid],
            uuid: []
        };

        request.param.transaction = {
            call: this.protocol_profile === '1_call',
            registration: this.protocol_profile === '1_registration',
            rest: this.protocol_profile === '1_default'
        };

        const windowData = {
            loaded: false,
            data: null,
            dataQOS: null,
            id: row.data.sid,
            mouseEventData: mouseEventData,
            snapShotTimeRange: Functions.cloneObject(request.timestamp),
            headerColor: color || ''
        };

        this.arrWindow.push(windowData);

        const readyToOpen = (data, dataQOS) => {
            if (!data || !dataQOS) {
                return;
            }
            windowData.loaded = true;
            windowData.data = data;
            windowData.dataQOS = dataQOS;
        }
        let localDataQOS: any = null, localData: any = null;

        this._ers.postQOS(this.searchService.queryBuilderQOS(row, selectedCallId)).toPromise().then(dataQOS => {
            localDataQOS = dataQOS;
            readyToOpen(localData, localDataQOS);
        });

        this._cts.getTransaction(request).toPromise().then(data => {
            localData = data;
            readyToOpen(localData, localDataQOS);
        });
    }

    closeWindow(id: number) {
        this.arrWindow.splice(id, 1);
    }

    public async addWindowMessage(row: any, mouseEventData = null) {
        if ((this.arrMessageDetail.filter(i => i.id === row.data.id)[0] != null)) {
            return;
        }
        const color = Functions.getColorByString(row.data.method || 'LOG');
        const mData = {
            loaded: false,
            data: null,
            id: row.data.id,
            headerColor: color || '',
            mouseEventData: mouseEventData || row.data.mouseEventData,
            isBrowserWindow: row.isBrowserWindow
        };

        if (row.isLog) {
            const data = row.data.item;
            mData.data = data;
            mData.data.item = {
                raw: mData.data.raw
            };
            mData.data.messageDetaiTableData = Object.keys(mData.data)
                .map(i => {
                    let val;
                    if (i === 'create_date') {
                        val = moment(mData.data[i]).format('DD-MM-YYYY hh:mm:ss.SSS');
                    } else if (i === 'timeSeconds') {
                        val =  mData.data[i];
                    } else {
                        val = mData.data[i];
                    }
                    return {name: i, value: val};
                })
                .filter(i => typeof i.value !== 'object' && i.name !== 'raw');
            this.changeDetectorRefs.detectChanges();
            mData.loaded = true;
            this.arrMessageDetail.push(mData);
            return;
        }
        let _timestamp = {
            from: row.data.create_date + this.limitRange.message_from, // - 1sec
            to: row.data.create_date + this.limitRange.message_to // + 1sec
        };
        if (!_timestamp.from || !_timestamp.to) {
            _timestamp = this.config.timestamp;
        }
        const request = {
            param: Functions.cloneObject(this.config.param || {} as any),
            timestamp: _timestamp
        };

        request.param.limit = 1;
        request.param.search[this.protocol_profile] = { id: row.data.id };
        request.param.transaction = {
            call: this.protocol_profile === '1_call',
            registration: this.protocol_profile === '1_registration',
            rest: this.protocol_profile === '1_default'
        };

        this.arrMessageDetail.push(mData);

        const result: any = await this._scs.getMessage(request).toPromise();

        mData.data = result.data[0];
        mData.data.item = {
            raw: mData.data.raw
        };
        mData.data.messageDetaiTableData = Object.keys(mData.data).map(i => {
            let val;
            if (i === 'create_date') {
                val = moment(mData.data[i]).format('DD-MM-YYYY hh:mm:ss.SSS');
            } else if (i === 'timeSeconds') {
                val = mData.data[i];
            } else {
                val = mData.data[i];
            }
            return {name: i, value: val};
        }).filter(i => typeof i.value !== 'object' && i.name !== 'raw');

        result.decoded = null;
        this._scs.getDecodedData(request).toPromise().then(res => {
            if (res.data) {
                result.decoded = res.data[0].decoded;
            }
            if (result.decoded) {
                if(result.decoded[0]) {
                    if (result.decoded[0]._source && result.decoded[0]._source.layers) {
                        mData.data.decoded = result.decoded[0]._source.layers;
                    } else {
                        mData.data.decoded = result.decoded[0];
                    }
                } else {
                    mData.data.decoded = result.decoded;
                }
                /* for update Dialog window */
                mData.data = Functions.cloneObject(mData.data);
                this.changeDetectorRefs.detectChanges();
            }
        });
        this.changeDetectorRefs.detectChanges();
        mData.loaded = true;
    }

    public closeWindowMessage(id: number) {
        this.arrMessageDetail.splice(id, 1);
    }

    ngOnDestroy () {
        if (this.subscriptionRangeUpdateTimeout) {
            this.subscriptionRangeUpdateTimeout.unsubscribe();
        }
        window.document.body.removeEventListener('mouseup', this.onSizeToFit.bind(this));
        if (window.document.body['removeAllListeners']) {
            window.document.body['removeAllListeners']();
        }
        clearInterval(this._interval);
    }
}
