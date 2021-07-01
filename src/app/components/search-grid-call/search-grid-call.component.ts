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
    HostListener,
    Output,
    EventEmitter,
    ViewChild,
    ChangeDetectionStrategy
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
    PreferenceAdvancedService,
    ShareLinkService
} from '@app/services';
import { DialogSettingsGridDialog } from './grid-settings-dialog/grid-settings-dialog';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
    selector: 'app-search-grid-call',
    templateUrl: './search-grid-call.component.html',
    styleUrls: ['./search-grid-call.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchGridCallComponent implements OnInit, OnDestroy, AfterViewInit {
    private gridApi;
    private gridColumnApi;
    public context;
    public frameworkComponents;
    isSearchPanel = false;
    @Input() inContainer = false;
    @Input() id: string = null;
    @Output() dataReady: EventEmitter<any> = new EventEmitter();

    @ViewChild('searchSlider', { static: false }) searchSlider: any;
    filterGridValue: string;
    defaultColDef: Object;
    columnDefs: Array<Object>;
    myPredefColumns: Array<Object>;
    rowData: any = [];
    showPortal = false;
    loader = false;
    noRowsTemplate = `<span class="norowstemplate">Adjust params and do a search to show results</span>`;
    private isOpenDialog = false;
    title = 'Call Result';
    isLoading = false;
    activeRow = '';
    comingRequest: any = null;
    arrWindow: Array<any> = [];
    arrMessageDetail: Array<any> = [];
    searchQueryLoki: any = {};
    searchSliderFields = [];
    isLokiQuery = false;
    lastTimestamp: number;
    localData: any;
    queryTextLoki: string;

    lokiSorted = '';
    searchSliderConfig = {
        countFieldColumns: 4,
        config: {
            protocol_id: {
                name: 'SIP',
                value: 1
            },
            protocol_profile: {
                name: 'call',
                value: 'call'
            },
            searchbutton: false,
            title: 'CALL 2 SIP SEARCH'
        },
        fields: [],
        protocol_id: {
            name: 'SIP',
            value: 100
        },
        refresh: false,
    };
    agGridSizeControl = {
        sizeToFit: true,
        sizeColumnsToFit: false,
        autoSizeAllColumns: false,
    };
    gridOptions: GridOptions = <GridOptions>{
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
        config: {},
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
        timestamp: { from: 0, to: 0 },
        lokiSort: ''
    };
    lokiSort = 'desc';
    private limitRange: any = {
        from: -300000, // - 5min
        to: 600000, // + 10min
        message_from: -5000, // - 1sec
        message_to: 5000, // + 1sec

    };

    private isThisSelfQuery = false;
    private _interval: any;
    private subscriptionRangeUpdateTimeout: Subscription;
    public subscriptionDashboardEvent: Subscription;
    private _latestQuery: string;

    constructor(
        public dialog: MatDialog,
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
            minWidth: 34,
            maxWidth: 34,
            resizable: false,
            checkboxSelection: true,
            lockPosition: true,
            cellRendererParams: { checkbox: true },
            pinned: 'left',
            cellClass: 'no-border',
            headerClass: 'no-border',
            headerCheckboxSelection: true
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
        if (!this.gridApi || !this.agGridSizeControl.sizeToFit) {
            return;
        }

        setTimeout(() => {
            if (this.agGridSizeControl.sizeToFit) {
                this.gridApi.sizeColumnsToFit();
            }
        }, 300);
    }

    ngOnInit() {
        this.lokiSort = this.getLokiSort();
        if (this.isLokiQuery) {
            this.update(true);
        }
        if (this.inContainer) {
            this.subscriptionDashboardEvent = this._ds.dashboardEvent.subscribe(data => {
                const dataId = data.resultWidget[this.id];
                if (dataId && dataId.query && this.lastTimestamp !== dataId.timestamp) {
                    this.localData = dataId.query;

                    this.protocol_profile = this.localData.protocol_id;

                    this.lastTimestamp = dataId.timestamp;

                    if (this.protocol_profile === ConstValue.LOKI_PREFIX || (this.localData && this.localData.serverLoki)) {
                        this.queryTextLoki = dataId.query.text;
                        this.lokiSort = this.localData.lokiSort || this.config.lokiSort;
                        this.isLokiQuery = true;

                        this.update(true);
                    } else {
                        this.isLokiQuery = false;
                    }
                    this.config.param.search = {};
                    this.config.param.search[this.protocol_profile] = this.localData.fields;


                    if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
                        this.config.param.location[this.localData.location.mapping] = this.localData.location.value;
                    }

                    if (!this.subscriptionRangeUpdateTimeout) {
                        this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(() => {
                            this.update();
                        });
                        this.config.lokiSort = this.lokiSort;
                    } else {
                        this.update(true);
                    }
                    this.changeDetectorRefs.detectChanges();
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
                    this.changeDetectorRefs.detectChanges();
                }
            });
            if (!this.subscriptionRangeUpdateTimeout) {
                this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(() => {
                    this.update(true);
                });
            }
            this.getHeaders();
        }
        
        this.recoverAgGridSizeControl();

        this._pas.getAll().toPromise().then((result: any) => {
            this.limitRange.from = -300000;
            this.limitRange.to = 600000;
            this.limitRange.message_from = -1000;
            this.limitRange.message_to = 1000;

            if (result && result.data) {
                const _advanced = result.data.find(i => i.category === 'search' && i.param === 'transaction');
                if (_advanced && _advanced.data && _advanced.data.lookup_range) {
                    const [from, to, message_from, message_to] = _advanced.data.lookup_range;
                    this.limitRange.from = (from * 1000) || -300000;
                    this.limitRange.to = (to * 1000) || 600000;
                    this.limitRange.message_from = (message_from * 1000) || -2000;
                    this.limitRange.message_to = (message_to * 1000) || 2000;
                    this.changeDetectorRefs.detectChanges();
                }
            }
        });
    }
    private recoverAgGridSizeControl() {
        /** recover agGridSizeControl settings from localStorage */
        const agGridSettings =
            localStorage.getItem(ConstValue.SIZE_CONTROL) || '{}';
        const fromLocalStorage = Functions.JSON_parse(agGridSettings);
        this.agGridSizeControl.sizeColumnsToFit =
            fromLocalStorage.sizeColumnsToFit ||
            this.agGridSizeControl.sizeColumnsToFit;
        this.agGridSizeControl.sizeToFit =
            fromLocalStorage.sizeToFit || this.agGridSizeControl.sizeToFit;
        this.agGridSizeControl.autoSizeAllColumns =
            fromLocalStorage.autoSizeAllColumns ||
            this.agGridSizeControl.autoSizeAllColumns;

        this.updateAgGridSizing();
    }

    private updateAgGridSizing() {
        if (this.agGridSizeControl.sizeToFit) {
            this.sizeToFit();
        }
        if (this.agGridSizeControl.sizeColumnsToFit) {
            setTimeout(() => {
                this.autoSizeAll(true);
            }, 300);
        }
        this.changeDetectorRefs.detectChanges();
    }

    private autoSizeAll(skipHeader) {
        if (!this.gridColumnApi) {
            return;
        }
        const allColumnIds = [];
        this.gridColumnApi.getAllColumns().forEach(({ colId }) => {
            allColumnIds.push(colId);
        });
        this.gridColumnApi.autoSizeColumns(allColumnIds, skipHeader);
    }

    async initSearchSlider(isImportantClear = false) {
        this.isThisSelfQuery = false;


        const query = this._ds.getSliderQueryDataToWidgetResult(this.id)
            || this._ds.setSliderQueryDataToWidgetResult(this.id, this.searchService.getLocalStorageQuery());

        if (!query || !query.protocol_id) {
            return;
        }
        const mappings: Array<any> = (await this._pmps.getAll().toPromise() as any).data as Array<any>;
        const [query_hepid, query_protocol_id]: [number, string] = query.protocol_id.replace('_', ',').split(',');
        const [mappingItem] = mappings.filter(i => i.profile === query_protocol_id && i.hepid === query_hepid * 1);
        const mapping = mappingItem && Functions.cloneObject(mappingItem.fields_mapping) || [];

        mapping.push({ id: ConstValue.LIMIT, name: 'Query Limit' });
        this.changeDetectorRefs.detectChanges();
        if (!this.inContainer) {
            setTimeout(() => {
                this.searchSliderFields = isImportantClear ? [] : this.searchSlider.getFields();
                if (query && query.fields && query.fields instanceof Array) {
                    query.fields.forEach(i => {
                        if (!this.searchSliderFields.map(j => j.field_name).includes(i.name)) {
                            const [itemname] = mapping.filter(j => j.id === i.name);
                            const itemField: any = {
                                field_name: i.name,
                                hepid: query_hepid * 1,
                                name: i.name,
                                selection: itemname && itemname.name || i.name, // test
                                type: i.type,
                                value: ['intager', 'number'].includes(i.type) ? parseInt(i.value, 10) : String(i.value)
                            };
                            this.searchSliderFields.push(itemField);
                        } else {
                            const [_searchSliderField] = this.searchSliderFields.filter(j => j.field_name === i.name);
                            if (_searchSliderField) {
                                _searchSliderField.value = i.value;
                            }
                        }
                    });
                }
                this.searchSliderConfig.config.protocol_id = {
                    name: mappingItem && mappingItem.hep_alias,
                    value: query_hepid * 1
                };
                this.searchSliderConfig.config.protocol_profile = {
                    name: query_protocol_id,
                    value: query_protocol_id
                };

                this.searchSliderConfig.fields = Functions.cloneObject(this.searchSliderFields);
                this.searchSliderFields = Functions.cloneObject(this.searchSliderFields);
                this.searchSliderConfig.countFieldColumns = this.searchSliderConfig.fields.filter(i => i.value !== '').length;
                this.config.config = this.searchSliderConfig.config;
                this.config.fields = this.searchSliderFields;
                this.changeDetectorRefs.detectChanges();
            });
        }
    }


    getSearchSlider() {
        return this.searchSliderConfig.fields.filter(i => i.value !== '').length;
    }

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
                    const sids: Array<string> = params.param.search[this.protocol_profile].callid;
                    this.config.param.search = {};
                    this.config.param.search[this.protocol_profile] = [{
                        name: 'sid',
                        value: sids.join(';'),
                        type: 'string',
                        hepid: 1
                    }];
                } else {
                    this.config.param.search = {};
                    this.config.param.search[this.protocol_profile] = [];
                }
                this.config.param.transaction = {};
                this.config.param.limit = 200;
                delete this.config.param.id;
                this.isLokiQuery = false;
            } else {
                this.localData = this.searchService.getLocalStorageQuery();
                if (this.lokiSort) {
                    this.localData.lokiSort = this.lokiSort;
                }

                this.protocol_profile = this.localData.protocol_id;

                if (this.protocol_profile === ConstValue.LOKI_PREFIX || (this.localData && this.localData.serverLoki)) {
                    this.isLokiQuery = true;
                    this.queryTextLoki = this.localData.text;


                } else {
                    this.isLokiQuery = false;
                }
                this.config.param.search = {};
                this.config.param.search[this.protocol_profile] = this.localData.fields;

                if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
                    this.config.param.location[this.localData.location.mapping] = this.localData.location.value;
                }
            }
        }

        if (this.comingRequest) {
            this.protocol_profile = this.comingRequest.protocol_id;
            this.config.param.search = {};
            this.config.param.search[this.comingRequest.protocol_id] = this.comingRequest.fields;

            if (this.comingRequest.location && this.comingRequest.location.value !== '' && this.comingRequest.location.mapping !== '') {
                this.config.param.location[this.comingRequest.location.mapping] = this.comingRequest.location.value;
            }
        }
    }

    public onUpdateQueryLoki(event) {

        this.searchQueryLoki = event;
        this.searchQueryLoki.lokiSort = this.lokiSort;
        this.searchQueryLoki.limit = this.localData.limit * 1 || 100;
        this.searchQueryLoki.protocol_id = ConstValue.LOKI_PREFIX;
        this.searchQueryLoki.fields = [];
        this.searchService.setLocalStorageQuery(this.searchQueryLoki);
    }
    public onUpdateLokiSort(event) {

        this.searchQueryLoki.lokiSort = event;
        localStorage.setItem('lokiSort', event);
        this.searchService.setLocalStorageQuery(this.searchQueryLoki);
    }
    public getLokiSort() {
        return localStorage.getItem('lokiSort');
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
            const sids: Array<string> = params.param.search[this.protocol_profile].callid;
            if (sids && sids.length > 1) {
                if(typeof this.gridApi !== 'undefined'){
                    this.gridApi.forEachLeafNode(node => {
                        if (sids.indexOf(node.data.sid) !== -1) {
                            node.setSelected(true, true);
                        }
                    });
                } else {
                    setTimeout(() => {
                        this.selectCallIdFromGetParams();
                    }, 50);
                }
            } 
        }
    }
    private async openTransactionByAdvancedSettings() {
        const params = Functions.getUriJson();
        if (params && params.param && !this.isOpenDialog) {
            this.isOpenDialog = true;
            const advanced = await this._pas.getAll().toPromise();
            if (!advanced || !advanced.data) {
                return;
            }
            try {
                const setting = advanced.data.filter(i => i.category === 'export' && i.param === 'transaction');
                if (setting && setting[0] && setting[0].data) {
                    const { openwindow } = setting[0].data;
                    if (openwindow === true) {
                        const sids = params.param.search[this.protocol_profile].callid;
                        const rowData: Array<any> = Functions.cloneObject(this.rowData) as Array<any>;

                        this.openTransactionDialog({
                            data: sids.map(j => rowData.filter(i => i.sid === j)[0])[0]
                        }, null, sids);
                    }
                }
            } catch (err) { }
        }
    }
    private async getHeaders() {
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
        const data: any = await this._pmps.getAll().toPromise();
        const arrData: Array<any> = data && data.data;
        arrData.forEach((a: any) => {
            const keyHep = a.hepid + '_' + a.profile;
            if (
                (this.isLokiQuery && a.hepid === 2000 && a.hep_alias === 'LOKI') ||
                (marData.length === 0 && this.config.param.search && this.config.param.search.hasOwnProperty(keyHep))
            ) {
                marData = a.fields_mapping;
                hepVersion = parseInt(a.hepid + '', 10);
            }
        });

        if (marData.length > 0) {
            const myRemoteColumns = [];

            /* don't add create date  */
            if (hepVersion < 2000) {
                myRemoteColumns.push({ headerName: 'ID', field: 'id', minWidth: 20, maxWidth: 40, hide: true });
                myRemoteColumns.push({
                    headerName: 'Date', field: 'create_date', filter: true, suppressSizeToFit: true,
                    valueFormatter: (item: any) => item.value ? moment(item.value).format('YYYY-MM-DD HH:mm:ss.SSS Z') : null
                });
            }
            for (const h of marData) {
                const idArray = h.id.split('.');
                const idColumn: any = idArray[idArray.length - 1];

                /* skip if skip == true */
                if (idColumn === 'raw' || idColumn === ConstValue.LIMIT || (h.hasOwnProperty('skip') && h.skip === true)) {
                    continue;
                }

                /* default column values */
                const vaColumn: any = { headerName: h.name, field: idColumn, filter: true, resizable: true };
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
                        (item: any) => item.value ? moment(item.value).format('YYYY-MM-DD HH:mm:ss.SSS Z') : null;
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
                        'line-height': '1.1rem',
                        'padding-bottom': '5px'
                    };
                    vaColumn.autoHeight = true;
                }
                myRemoteColumns.push(vaColumn);
            }
            const restoreColumns = this.localStateHeaders(myRemoteColumns);
            this.columnDefs = hepVersion < 2000 ? this.myPredefColumns.concat(restoreColumns) : myRemoteColumns;
            this.sizeToFit();
            this.changeDetectorRefs.detectChanges();
        }
    }

    private localStateHeaders(apiColumn) {
        let lsIndex = 'result-state';
        const _apiColumn = [];
        if (this.id) {
            lsIndex += `-${this.id}`;
        }
        let h: any = localStorage.getItem(lsIndex);

        if (!h) {
            return apiColumn;
        }
        h = JSON.parse(h);
        const repeatBuffer = {};
        h = h.filter(i => {
            if (!repeatBuffer[i.name + i.field]) {
                repeatBuffer[i.name + i.field] = 0;
            }
            repeatBuffer[i.name + i.field]++;
            return repeatBuffer[i.name + i.field] === 1;
        });

        apiColumn.forEach(col => {
            const f = h.filter(i => i.field === col.field && i.name === col.headerName)[0];
            if (f) {
                col.hide = !f.selected;
            }
        });
        h.forEach(col => {
            const f = apiColumn.filter(i => i.field === col.field && i.headerName === col.name)[0];
            if (f) {
                _apiColumn.push(f);
            }
        });

        return _apiColumn;
    }

    private isNewData(): boolean {
        const json = JSON.stringify;
        const _md5 = Functions.md5(
            json(this.queryBuilderForLoki()) +
            json(this.isLokiQuery) +
            json(this._dtrs.getDatesForQuery(true)) +
            json(this.config) +
            json(this.searchQueryLoki)
        );
        const bool = this._latestQuery === _md5;
        if (!bool) {
            this._latestQuery = _md5;
        }
        return bool;

    }

    public update(isImportant = false) {
        this.loader = true;
        if (this.isNewData() && !isImportant) {
            return;
        }
        this.config.timestamp = this._dtrs.getDatesForQuery(true);
        this.config.lokiSort = this.lokiSort;
        if (this.localData) {
            this.localData.lokiSort = this.config.lokiSort;
        }

        if (this.inContainer) { /* if ag-grid in result widget */
            this.getHeaders();
        } else {
            this.getQueryData();
        }
        this.rowData = null;
        if (this.isLokiQuery) {
            this._srs.getData(this.queryBuilderForLoki()).toPromise().then(result => {
                this.loader = false;
                this.rowData = result.data.sort((a, b) => {
                    a = new Date(a.micro_ts).getTime();
                    b = new Date(b.micro_ts).getTime();
                    if (this.lokiSort === 'desc') {
                        return (a < b) ? 1 : ((a > b) ? -1 : 0);
                    } else if (this.lokiSort === 'asc') {
                        return (a < b) ? -1 : ((a > b) ? 1 : 0);
                    }
                });
                this.sizeToFit();
                this.changeDetectorRefs.detectChanges();
                if(this.rowData) { /** for grid updated autoHeight and sizeToFit */
                    this.rowData = Functions.cloneObject(this.rowData);
                    if (this.rowData) { this.loader = false; }
                    this.dataReady.emit({});
                    this.changeDetectorRefs.detectChanges();
                };
            }, err => {
                this.rowData = [];
                this.dataReady.emit({});
            });
        } else {
            this._scs.getData(this.config).toPromise().then(result => {
                if (!result || !result.data) {
                    this.rowData = [];
                    this.dataReady.emit({});
                    this.changeDetectorRefs.detectChanges();

                    return;
                }

                this.rowData = result.data;
                if (this.rowData) { this.loader = false; }
                for (let i = 0; i < this.rowData.length; i++) {
                    if (this.rowData[i].protocol !== undefined && this.rowData[i].protocol === 17) {
                        this.rowData[i].protocol = 'UDP';
                    } else if (this.rowData[i].protocol !== undefined && this.rowData[i].protocol === 6) {
                        this.rowData[i].protocol = 'TCP';
                    }
                }
                this.sizeToFit();
                this.selectCallIdFromGetParams();
                this.openTransactionByAdvancedSettings();
                this.dataReady.emit({});
                this.initSearchSlider();

                this.changeDetectorRefs.detectChanges();
            }, err => {
                this.rowData = [];
                this.dataReady.emit({});
            });
        }
    }

    ngAfterViewInit() {
        window.document.body.addEventListener('mouseup', this.onSizeToFit.bind(this));
        this.changeDetectorRefs.detectChanges();
    }

    onSizeToFit() {
        if (!this.gridApi) {
            return;
        }
        this.sizeToFit();
        this.changeDetectorRefs.detectChanges();
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

    private intToARGB(i: any) {
        return ((i >> 24) & 0xFF);
    }

    private getCallIDColor(params) {
        return (!params.hasOwnProperty('value') ||
            (typeof params.value === 'undefined')) ? {} :
            { 'color': Functions.getColorByString(params.value, 100, 25, 1, 180) };
    }

    private getMethodColor(params) {
        if (params.hasOwnProperty('value') && typeof params.value !== undefined) {

            const color = Functions.getMethodColor(params.value);

            return { 'color': color };
        } else {
            return {};
        }
    }

    private getBkgColorTable(params) {
        if (this.isLokiQuery) {
            return {
                'background-color': '#fff'
            };
        }
        return {
            'background-color': Functions.getColorByString(params.data.sid, 60, 80, 0.8)
        };
    }

    private sizeToFit() {
        if (!this.agGridSizeControl.sizeToFit) {
            return;
        }
        if (this._interval) {
            clearInterval(this._interval);
        }
        this._interval = setTimeout(() => {
            if (this.gridApi && this.agGridSizeControl.sizeToFit) {
                this.gridApi.sizeColumnsToFit();
            }
        }, 100);
    }

    setQuickFilter() {
        this.gridOptions.api.setQuickFilter(this.filterGridValue);
        this.changeDetectorRefs.detectChanges();
    }

    public onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
    }

    public openTransactionForSelectedRows(index, row, mouseEventData = null) {
        const data = { data: row };
        this.openTransactionDialog(data, mouseEventData);
    }

    public openMethodForSelectedRow(index, row, mouseEventData = null) {
        const data = { data: row };
        this.addWindowMessage(data, mouseEventData);
    }

    public openTransactionDialog(row, mouseEventData = null, callisArray = null) {
        // do not open duplicate window

        const sid = row.data.callid ? row.data.callid : row.data.sid;

        if ((this.arrWindow.filter(i => i.id === sid)[0] != null)) {
            return;
        }

        const _protocol_profile = row && row.data && row.data.profile ? row.data.profile : this.protocol_profile;

        const selectedRows = this.gridApi.getSelectedRows();

        /* clear from clones */
        const selectedCallId = callisArray || selectedRows.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);

        const timeArray = selectedRows.map(i => i.create_date || i.update_ts);
        const timeArray_from = this.config.timestamp.from ? this.config.timestamp.from :
            selectedRows.length ? Math.min.apply(this, timeArray) : row.data.create_date;
        const timeArray_to = this.config.timestamp.to ? this.config.timestamp.to :
            selectedRows.length ? Math.max.apply(this, timeArray) : row.data.create_date;

        const color = Functions.getColorByString(sid, 75, 60, 1);

        const request = {
            param: Functions.cloneObject(this.config.param || {} as any),
            timestamp: {
                from: timeArray_from + this.limitRange.from,
                to: timeArray_to + this.limitRange.to
            }
        };

        request.param.search = {};
        request.param.search[_protocol_profile] = {
            id: row.data.id,
            callid: selectedCallId.length > 0 ? selectedCallId : [sid],
            uuid: []
        };

        request.param.transaction = {
            call: !!_protocol_profile.match('call'),
            registration: !!_protocol_profile.match('registration'),
            rest: !!_protocol_profile.match('default')
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
            if (!data) {
                return;
            }
            windowData.loaded = true;
            windowData.data = data;
            windowData.dataQOS = dataQOS;

            this.changeDetectorRefs.detectChanges();
        };
        let localDataQOS: any = null, localData: any = null;
        this._cts.getTransaction(request).toPromise().then(res => {
            const allCallIds = res.data.calldata.map(i => i.sid).sort().filter((i, k, a) => a[k - 1] !== i);
            const timestampArray: Array<number> = [];
            res.data.calldata.forEach(data => timestampArray.push(data.micro_ts));
            const timestamp = {
                from: Math.min(...timestampArray) + this.limitRange.from,
                to: Math.max(...timestampArray) + this.limitRange.to
            };
            windowData.snapShotTimeRange = timestamp;
            this._ers.postQOS(this.searchService.queryBuilderQOS(row, allCallIds, timestamp)).toPromise().then(dataQOS => {
                localDataQOS = dataQOS;
                readyToOpen(localData, localDataQOS);
            });

            localData = res;
            readyToOpen(localData, localDataQOS);

        });
        this.changeDetectorRefs.detectChanges();
    }

    closeWindow(id: number) {
        this.arrWindow.splice(id, 1);
        this.changeDetectorRefs.detectChanges();
    }

    public async addWindowMessage(row: any, mouseEventData = null) {
        if ((this.arrMessageDetail.filter(i => i.id === row.data.id)[0] != null)) {
            return;
        }

        const _protocol_profile = row && row.data && row.data.profile ? row.data.profile : this.protocol_profile;

        const color = Functions.getMethodColor(row.data.method);
        const mData = {
            loaded: false,
            data: {} as any,
            id: row.data.id,
            headerColor: color || '',
            mouseEventData: mouseEventData || row.data.mouseEventData,
            isBrowserWindow: row.isBrowserWindow
        };

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
        request.param.search = {};
        request.param.search[_protocol_profile] = { id: row.data.id };
        request.param.transaction = {
            call: !!_protocol_profile.match('call'),
            registration: !!_protocol_profile.match('registration'),
            rest: !!_protocol_profile.match('default')
        };

        if (row.data && row.data.dbnode && request.param.location && request.param.location.node) {
            request.param.location.node = [row.data.dbnode];
        }

        this.arrMessageDetail.push(mData);


        if (row.isLog || (row.data.payloadType === 1 && (row.data.raw || row.data.item && row.data.item.raw))) {
            let data;
            if (typeof row.data.item !== 'undefined' && row.data.item.length < 1) {
                data = row.data.item;
            } else {
                data = row.data;
            }

            mData.data = Functions.cloneObject(data) || {};

            if (typeof mData.data.raw === 'undefined') {
                mData.data.raw = {
                    raw: Functions.stylingRowText(mData.data.item.raw)
                };
            } else {
                mData.data.item = {
                    raw: Functions.stylingRowText(mData.data.raw)
                };
            }

            mData.data.messageDetailTableData = Object.keys(mData.data).map(i => {
                let val;
                if (i === 'create_date') {
                    val = moment(mData.data[i]).format('DD-MM-YYYY hh:mm:ss.SSS Z');
                } else if (i === 'timeSeconds') {
                    val = mData.data[i];
                } else {
                    val = mData.data[i];
                }
                return { name: i, value: val };
            }).filter(i => typeof i.value !== 'object' && i.name !== 'raw');

            this.changeDetectorRefs.detectChanges();
            mData.loaded = true;
            return;
        } else {
            const result: any = await this._scs.getMessage(request).toPromise();

            mData.data = result && result.data && result.data[0] ? result.data[0] : {};
            mData.data.item = {
                raw: Functions.stylingRowText(mData && mData.data && mData.data.raw ? mData.data.raw : 'raw is empty')
            };
            mData.data.messageDetailTableData = Object.keys(mData.data).map(i => {
                let val;
                if (i === 'create_date') {
                    val = moment(mData.data[i]).format('DD-MM-YYYY hh:mm:ss.SSS Z');
                } else if (i === 'timeSeconds') {
                    val = mData.data[i];
                } else {
                    val = mData.data[i];
                }
                return { name: i, value: val };
            }).filter(i => typeof i.value !== 'object' && i.name !== 'raw');

            mData.loaded = true;
            this.changeDetectorRefs.detectChanges();
        }

        if (!row.isLog) {
            const res = await this._scs.getDecodedData(request).toPromise();
            let _decoded = null;
            if (res.data && res.data[0] && res.data[0].decoded) {
                _decoded = res.data[0].decoded;
            }
            if (_decoded && _decoded[0]) {
                if (_decoded[0]._source && _decoded[0]._source.layers) {
                    mData.data.decoded = _decoded[0]._source.layers;
                } else {
                    mData.data.decoded = _decoded[0];
                }
            } else {
                mData.data.decoded = _decoded;
            }
            /* for update Dialog window */
            mData.data = Functions.cloneObject(mData.data);
            this.changeDetectorRefs.detectChanges();

        }
    }

    public closeWindowMessage(id: number) {
        this.arrMessageDetail.splice(id, 1);
        this.changeDetectorRefs.detectChanges();
    }
    onLokiSort() {
        this.lokiSort = this.lokiSorted;
        this.changeDetectorRefs.detectChanges();
    }
    onSettingButtonClick() {
        const params = {
            api: this.gridApi,
            columnApi: this.gridColumnApi,
            context: this.context,
            lokiSort: this.lokiSort
        } as any;

        this.dialog.open(DialogSettingsGridDialog, {
            data: {
                agGridSizeControl: this.agGridSizeControl,
                apicol: params.columnApi,
                apipoint: params.api,
                columns: params.context.componentParent.columnDefs,
                idParent: params.context.componentParent.id,
            },
        }).afterClosed().toPromise().then(() => {
            localStorage.setItem(
                'resultsChartSetting',
                JSON.stringify(this.agGridSizeControl)
            );
        });;
        this.changeDetectorRefs.detectChanges();
    }
    export() {
        const params = {
            api: this.gridApi,
            columnApi: this.gridColumnApi,
            context: this.context,
        } as any;

        this.dialog.open(ExportDialogComponent, {
            width: '500px',
            data: {
                apicol: params.columnApi,
                apipoint: params.api,
                columns: params.context.componentParent.columnDefs,
                idParent: params.context.componentParent.id,
                protocol: this.protocol_profile,
            },
        });
    }

    onColumnMoved(event) {
        const bufferData = Functions.cloneObject(event.api.columnController.gridColumns.map(i => i.colDef));
        let lsIndex = 'result-state';
        if (this.id) {
            lsIndex += `-${this.id}`;
        }
        localStorage.setItem(lsIndex, JSON.stringify(bufferData.map(i => ({
            name: i.headerName,
            field: i.field,
            selected: !i.hide
        }))));
        this.changeDetectorRefs.detectChanges();
    }
    ngOnDestroy() {
        if (this.subscriptionDashboardEvent) {
            this.subscriptionDashboardEvent.unsubscribe();
        }
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
