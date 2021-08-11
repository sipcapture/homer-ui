import { GridController } from './grid-controller';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { Functions, getStorage, log, setStorage } from '@app/helpers/functions';
import * as moment from 'moment';
import { ConstValue, UserConstValue } from '@app/models';
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
    LokiHighlightRenderer,
    ColumnMOSRenderer,
    ColumnCountryRenderer,
    ColumnAliasRenderer,
    ColumnUuidRenderer,
    GenericCellRenderer,
} from './renderer';
import {
    SearchCallService,
    DashboardService,
    SearchRemoteService,
    DateTimeRangeService,
    PreferenceMappingProtocolService,
    PreferenceUserSettingsService,
    SearchService,
    PreferenceAdvancedService,
    PreferenceIpAliasService,
    CopyService,
    DashboardEventData
} from '@app/services';
import { DialogSettingsGridDialog } from './grid-settings-dialog/grid-settings-dialog';
import { MatDialog } from '@angular/material/dialog';
import { FullTransactionService } from '../../services/call/full-transaction.service';
import { ExportDialogComponent } from './export-dialog/export-dialog.component';
import { MessageDetailsService } from '../../services/message-details.service';

import { StatusFilterComponent } from './filters/index';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat, TimeFormattingService } from '@app/services/time-formatting.service';
@Component({
    selector: 'app-search-grid-call',
    templateUrl: './search-grid-call.component.html',
    styleUrls: ['./search-grid-call.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageDetailsService]
})
export class SearchGridCallComponent
    extends GridController
    implements OnInit, OnDestroy, AfterViewInit {
    gridApi;
    gridColumnApi;
    _id: string = null;
    public context;
    public frameworkComponents;
    isSearchPanel = false;
    @Input() source = 'resultPage';
    @Input() inChartContainer = false;
    @Input() set id(val: string) {
        this._id = val;
    }
    get id(): string {
        return this._id;
    }
    @Input() chartConfig: any;
    @Input() isAutoRefrasher = false;
    @Output() dataReady: EventEmitter<any> = new EventEmitter();
    @Output() changeSettings: EventEmitter<any> = new EventEmitter();
    @ViewChild('searchSlider', { static: false }) searchSlider: any;
    filterGridValue: string;
    defaultColDef: ColDef;
    _columnDefs: Array<ColDef>;
    set columnDefs(value: Array<ColDef>) {
        this._columnDefs = value;
    }
    get columnDefs(): Array<ColDef> {
        return this._columnDefs;
    }
    myPredefColumns: Array<ColDef>;
    rowData: any = [];
    loader = false;
    onlyLoader = false;
    showPortal = false;
    private isOpenDialog = false;
    noRowsTemplate =
        `<span style="background:#c1c1c1; color:white; padding:20px; border-radius:3px; font-weight:bold">
            Adjust params and do a search to show results
        </span>`;
    title = 'Call Result';
    isLoading = false;
    activeRow = '';
    arrWindow: Array<any> = [];
    arrChartWindow: Array<any> = [];
    arrMessageDetail: Array<any> = [];
    searchQueryLoki: any;
    searchSliderFields = [];
    isLokiQuery = false;
    lastTimestamp: number;
    localData: any;
    queryTextLoki: string;
    showRegex;
    buttonName;
    isFirstInit = true;
    agGridSizeControl = {
        selectedType: 'sizeToFit',
        pageSize: 100
    };
    aliases = [];
    sortState = [];
    searchSliderConfig = {
        countFieldColumns: 4,
        config: {
            protocol_id: {
                name: 'SIP',
                value: 1,
            },
            protocol_profile: {
                name: 'call',
                value: 'call',
            },
            searchbutton: false,
            title: 'CALL 2 SIP SEARCH',
        },
        fields: [],
        protocol_id: {
            name: 'SIP',
            value: 100,
        },
        refresh: false,
    };
    mappings: any;

    gridOptions: GridOptions = <GridOptions>{
        defaultColDef: {
            sortable: true,
            resizable: true,
        },
        rowHeight: 38,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        getRowStyle: this.getBkgColorTable.bind(this),
        suppressCellSelection: true,
        suppressPaginationPanel: true
    };
    totalPages = 1;
    protocol_profile: string;

    config: any = {
        config: {},
        param: {
            transaction: {},
            limit: 200,
            orlogic: false,
            search: {},
            location: {},
            timezone: {
                value: -180,
                name: 'Local',
            },
        },
        timestamp: { from: 0, to: 0 },
    };

    private limitRange: any = {
        from: -300000, // - 5min
        to: 300000, // + 5min
        message_from: -5000, // - 1sec
        message_to: 5000, // + 1sec
    };

    public isThisSelfQuery = false;
    _interval: any;
    private subscriptionRangeUpdateTimeout: Subscription;
    public subscriptionDashboardEvent: Subscription;
    private _latestQuery: string;
    private dateFormat: DateFormat;
    copyData: string;
    copyTimeout;
    _idQuery: string;
    set idQuery(val: string) {
        this._idQuery = val;
    }
    get idQuery() {
        if (!this._idQuery) {
            throw new Error('idQuery is empty');
        }
        return this._idQuery;
    }


    constructor(
        public dialog: MatDialog,
        private _puss: PreferenceUserSettingsService,
        private _scs: SearchCallService,
        private _srs: SearchRemoteService,
        private _pmps: PreferenceMappingProtocolService,
        private _dtrs: DateTimeRangeService,
        private dashboardService: DashboardService,
        private _pas: PreferenceAdvancedService,
        private aliasService: PreferenceIpAliasService,
        private searchService: SearchService,
        private fullTransactionService: FullTransactionService,
        private cdr: ChangeDetectorRef,
        private messageDetailsService: MessageDetailsService,
        public translateService: TranslateService,
        private _tfs: TimeFormattingService,
        private copyService: CopyService
    ) {
        super();
        // this.cdr.detach();
        translateService.addLangs(['en']);
        translateService.setDefaultLang('en');
        this.myPredefColumns = [{
            headerName: '',
            field: '',
            minWidth: 34,
            maxWidth: 34,
            checkboxSelection: true,
            lockPosition: true,
            cellRendererParams: { checkbox: true },
            pinned: 'left',
            cellClass: 'no-border',
            headerClass: 'no-border',
            headerCheckboxSelection: true,
        }];

        this.context = { componentParent: this };
        this.frameworkComponents = {
            columnActionRenderer: ColumnActionRenderer,
            columnCallidRenderer: ColumnCallidRenderer,
            columnUuidRenderer: ColumnUuidRenderer,
            columnMethodRenderer: ColumnMethodRenderer,
            LokiHighlightRenderer: LokiHighlightRenderer,
            columnMOSRenderer: ColumnMOSRenderer,
            columnCountryRenderer: ColumnCountryRenderer,
            statusFilter: StatusFilterComponent,
            columnAliasRenderer: ColumnAliasRenderer,
            genericCellRenderer: GenericCellRenderer
        };
    }

    @HostListener('window:resize')
    onResize() {
        if (!this.gridApi || this.agGridSizeControl.selectedType !== 'sizeToFitContinuos') {
            return;
        }
        setTimeout(() => {
            if (this.agGridSizeControl.selectedType === 'sizeToFitContinuos' && this.loader === false) {
                this.gridApi.sizeColumnsToFit();
            }
        }, 300);
    }
    ngOnInit() {
        if (this.source === 'tab' || this.source === 'widget') {

            this.subscriptionDashboardEvent = this.dashboardService.dashboardEvent.subscribe((data: DashboardEventData) => {
                if (!data.current || !data.currentWidgetList.length) {
                    return;
                }
                // protosearchWidget - active Protosearch Widget On Current Dashboard
                const protosearchWidget = data.currentWidgetList?.find(
                    i => i.activeTab !== false && i.strongIndex === 'ProtosearchWidgetComponent'
                );
                let LocalStorageQueryData;
                let dataId = data.resultWidget[this.id];

                if (!dataId) {
                    if (protosearchWidget?.config?.config) {
                        const { protocol_id, protocol_profile } = protosearchWidget?.config?.config || {};
                        if (protocol_id?.value && protocol_profile?.value) {
                            LocalStorageQueryData = {
                                fields: [],
                                protocol_id: [protocol_id.value, protocol_profile.value].join('_')
                            };
                        }
                    } else {
                        LocalStorageQueryData = this.searchService.getLocalStorageQuery();
                    }

                    /** Default query for no empty results */
                    dataId = {
                        query: LocalStorageQueryData,
                        slider: LocalStorageQueryData,
                        timestamp: Date.now(),
                    };

                    this.dashboardService.setQueryToWidgetResult(
                        this.id,
                        LocalStorageQueryData,
                        true
                    );

                    this.cdr.detectChanges();
                }

                if ((dataId?.query || dataId?.slider) &&
                    this.lastTimestamp !== dataId.timestamp
                ) {
                    if (data.isFromSearch) {
                        this.dashboardService.setWidgetAsActive(this.id, 'ResultWidgetComponent');
                    }
                    this.localData = dataId.query || dataId.slider;
                    this.protocol_profile = this.localData.protocol_id;

                    this.localData.fields?.forEach((field) => {
                        if (field.func) {
                            field.value = field.func.value
                                .replace('::field::', field.name)
                                .replace('::value::', field.value);
                            delete field.func;
                        }
                    });


                    this.lastTimestamp = dataId.timestamp;

                    this.isLokiQuery = this.protocol_profile === ConstValue.LOKI_PREFIX;
                    if (this.isLokiQuery) {
                        this.queryTextLoki = dataId.query.text;

                    }

                    const { mapping: rm, value: rv } = this.localData.range || {};
                    const { mapping: lm, value: lv } = this.localData.location || {};

                    this.config.param.search = { [this.protocol_profile]: this.localData.fields };

                    if (rv && rm) {
                        this.config.param.search.range = { [rm]: rv };
                    }

                    if (lm && lv) {
                        this.config.param.location[lm] = lv;
                    }

                    if (this.localData?.orlogic) {
                        this.config.param.orlogic = this.localData?.orlogic;
                    }


                    if (!this.subscriptionRangeUpdateTimeout) {
                        this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(data => {
                            if (this.isFirstInit || this.isAutoRefrasher || data?.isImportant) {
                                this.update();
                                this.isFirstInit = false;
                            }
                        });
                    } else {
                        this.update(true);
                    }
                    this.cdr.detectChanges();
                }
                this.cdr.detectChanges();
            });
        } else {
            setTimeout(() => {
                /** <== fixing ExpressionChangedAfterItHasBeenCheckedError */
                /**
                 * update DateTimeRange from GET params
                 */
                const params = Functions.getUriJson();
                if (params?.timestamp) {
                    const { from, to } = params.timestamp;
                    const format = (d) =>
                        new Date(d)
                            .toLocaleString()
                            .split(',')
                            .map((i) => i.replace(/\./g, '/'))
                            .join('');
                    this._dtrs.updateDataRange({
                        title: [format(from), format(to)].join(' - '),
                        dates: [
                            new Date(from).toISOString(),
                            new Date(to).toISOString(),
                        ],
                    });
                }
                this.cdr.detectChanges();
            });
            if (!this.subscriptionRangeUpdateTimeout) {
                this.subscriptionRangeUpdateTimeout = this._dtrs.castRangeUpdateTimeout.subscribe(
                    () => {
                        this.update(true);
                        this.cdr.detectChanges();
                    }
                );
            }
            this.getHeaders();
        }

        this.config.config = Functions.cloneObject(this.searchSliderConfig.config);
        this.messageDetailsService.event.subscribe((data) => {

            this.addWindowMessage({ data: data.message }, null, data.metadata);
            this.cdr.detectChanges();
        });

        this.recoverAgGridSizeControl();
        this.getFormat();
        this._puss
            .getAll()
            .toPromise()
            .then((result: any) => {
                const d = result?.data?.find(
                    (i) => i.param === 'transaction:range'
                );
                if (d?.data) {
                    this.limitRange.from = d.data.from || -300000;
                    this.limitRange.to = d.data.to || 600000;
                    this.limitRange.message_from = d.data.message_from || -1000;
                    this.limitRange.message_to = d.data.message_to || 1000;
                }
            });
    }
    detectChanges() {
        setTimeout(() => {
            this.cdr.detectChanges();
        }, 100);
    }
    toggleRegex() {
        const regexInput = document.getElementById('regexfilter');
        this.showRegex = !this.showRegex;
        if (regexInput) {
            regexInput.style.display = 'inline-block';
        }
        if (this.showRegex) {
            this.buttonName = 'Hide';
        } else {
            this.buttonName = 'Show';
        }
    }

    getSearchSlider() {
        return this.searchSliderConfig.fields.filter((i) => i.value !== '')
            .length;
    }

    setQuickFilter() {
        this.gridOptions?.api?.setQuickFilter(this.filterGridValue);
    }

    chartChangeSettings(event) {
        if (this.inChartContainer) {
            this.changeSettings.emit(event);
        }
    }
    public async getAliasFromIp(ip) {
        const alias = await this.aliasService.resolveAlias(true, ip);
        setTimeout(() => {
            this.cdr.detectChanges();
        }, 10);
        return { name: alias, value: ip };
    }
    private getQueryData() {
        if (this.id) {
            return;
        }

        this.localData = this.searchService.getLocalStorageQuery();
        this.protocol_profile = this.localData.protocol_id;

        this.isLokiQuery = this.protocol_profile === ConstValue.LOKI_PREFIX;

        if (this.isLokiQuery) {
            this.queryTextLoki = this.localData.text;
        }

        const { mapping: rm, value: rv } = this.localData.range || {};
        const { mapping: lm, value: lv } = this.localData.location || {};

        this.config.param.search = { [this.protocol_profile]: this.localData.fields };

        if (rv && rm) {
            this.config.param.search.range = { [rm]: rv };
        }

        if (lm && lv) {
            this.config.param.location[lm] = lv;
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
                timezone: this.searchService.getTimeZoneLocal(),
            },
            timestamp: this._dtrs.getDatesForQuery(true),
        };
    }

    private selectCallIdFromGetParams() {
        const params = Functions.getUriJson();

        if (params?.param) {
            const sids: Array<string> =
                params.param.search[this.protocol_profile].callid;
            if (sids?.length > 1) {
                this.gridApi.forEachLeafNode((node) => {
                    if (sids.indexOf(node.data.sid) !== -1) {
                        node.setSelected(true, true);
                    }
                });
            }
        }
    }

    private async openTransactionByAdvancedSettings() {
        const params = Functions.getUriJson();
        if (params?.param && !this.isOpenDialog) {
            this.isOpenDialog = true;
            const advanced = await this._pas.getAll().toPromise();
            try {
                if (advanced?.data) {
                    const setting = advanced.data.find(
                        (i) => i.category === 'export' && i.param === 'transaction'
                    );
                    if (setting?.data?.openwindow === true) {
                        const sids =
                            params.param.search[this.protocol_profile]
                                .callid;
                        const rowData: Array<any> = Functions.cloneObject(
                            this.rowData
                        ) as Array<any>;
                        const [rowDataItem] = sids.map((j) =>
                            rowData.find((i) => i.sid === j)
                        );
                        this.openTransactionDialog(
                            {
                                data: rowDataItem,
                            },
                            null,
                            sids
                        );
                        this.cdr.detectChanges();
                    }
                }
            } catch (err) { }
        }
    }

    private async getHeaders() {
        const mappings: Array<any> = await this._pmps.getMerged().toPromise();
        let marData = [];
        const { fields_mapping, hepid } = mappings.find(({ hepid, hep_alias, profile }) =>
            (this.isLokiQuery && hepid === 2000 && hep_alias === 'LOKI') ||
            (marData.length === 0 &&
                this.config.param.search?.hasOwnProperty(`${hepid}_${profile}`)
            )
        ) || {};
        const condition = JSON.stringify(fields_mapping) === JSON.stringify(this.mappings);
        if (condition) {
            this.onlyLoader = true;
            this.cdr.detectChanges();
            return;
        } else {
            this.columnDefs = [];
            this.mappings = fields_mapping;
        }
        this.columnDefs = [];
        this.config.timestamp = this._dtrs.getDatesForQuery(true);

        this.getQueryData();

        /* this is normaly not needed - just a workaround to copy from search param */
        for (const item in this.config.param.search) {
            if ((this.config.param as Object).hasOwnProperty(item)) {
                const elem = this.config.param.search[item];
                if (
                    elem.filter((it) => it.name === ConstValue.LIMIT).length > 1
                ) {
                    this.config.param.limit = parseInt(
                        elem.find((it) => it.name === ConstValue.LIMIT).value,
                        10
                    );
                }
            }
        }
        let hepVersion = 0;


        if (fields_mapping && hepid) {
            marData = fields_mapping;
            hepVersion = parseInt(hepid + '', 10);
        }

        if (marData.length > 0 && Array.isArray(marData)) {
            const myRemoteColumns = [];
            /* don't add create date  */
            if (hepVersion < 2000) {
                myRemoteColumns.push({
                    headerName: 'ID',
                    field: 'id',
                    minWidth: 20,
                    maxWidth: 40,
                    hide: true,
                });
                myRemoteColumns.push({
                    headerName: 'Date',
                    field: 'create_date',
                    filter: true,
                    suppressSizeToFit: true,
                    valueFormatter: ({ value }) =>
                        value && moment(value).format(this.dateFormat.dateTime),
                });
            }
            marData?.forEach((h: any) => {
                const idColumn = h?.id?.split('.').pop();

                /* skip if skip == true */
                if (['raw', ConstValue.LIMIT].includes(idColumn) || h.skip) {
                    return;
                }
                /* default column values */
                const vaColumn: any = {
                    headerName: h.name,
                    field: idColumn,
                    filter: true,
                    resizable: true,
                    cellRenderer: 'genericCellRenderer'
                };

                if (['sid', 'callid'].includes(idColumn) || h.sid_type) {
                    vaColumn.cellStyle = this.getCallIDColor.bind(this);
                    vaColumn.cellRenderer = 'columnCallidRenderer';
                }
                // columnUuidRenderer
                if (['uuid'].includes(idColumn)) {
                    vaColumn.cellStyle = this.getCallIDColor.bind(this);
                    vaColumn.cellRenderer = 'columnUuidRenderer';
                }

                if (idColumn === 'destination_ip') {
                    vaColumn.cellRenderer = 'columnAliasRenderer';
                    vaColumn.getQuickFilterText = (params) => {
                        return params.data.aliasDst || params.value;
                    }

                } if (idColumn === 'source_ip') {
                    vaColumn.cellRenderer = 'columnAliasRenderer';
                    vaColumn.getQuickFilterText = (params) => {
                        return params.data.aliasSrc || params.value;
                    }

                }
                if (idColumn === 'mos' || h.mos) {
                    vaColumn.valueFormatter = ({ value }) => value && value / 100 || '';
                    vaColumn.cellStyle = this.getMosColor.bind(this);
                    vaColumn.cellRenderer = 'columnMOSRenderer';
                    vaColumn.getQuickFilterText = (params) => {
                        if (this.filterGridValue.includes('.')) {
                            return params.value / 100;
                        } else {
                            return params.value;
                        }
                    }
                }
                if (idColumn === 'duration' || h.duration) {
                    vaColumn.valueFormatter = ({ value }) => Functions.secondsToHour(value || 0);
                    vaColumn.getQuickFilterText = (params) => {
                        if (this.filterGridValue.includes(':')) {
                            return Functions.secondsToHour(params.value);
                        } else {
                            return params.value.toString();
                        }
                    }
                }
                if (idColumn === 'custom_1' && hepVersion === 2000) {
                    /** Loki column 'Message' */
                    vaColumn.cellRenderer = 'LokiHighlightRenderer';
                }
                if (idColumn === 'method' || h.method_type) {
                    vaColumn.cellRenderer = 'columnMethodRenderer';
                    vaColumn.cellStyle = this.getMethodColor.bind(this);
                }
                if (['dest_cc', 'geo_cc'].includes(idColumn)) {
                    vaColumn.cellRenderer = 'columnCountryRenderer';
                    vaColumn.cellStyle = {
                        display: 'flex',
                        justifyContent: 'center'
                    };
                }
                if (idColumn === 'status' || h.status) {
                    vaColumn.valueFormatter = (item: any) =>
                        (h.form_default.find(({ value }) => value === item.value) || { name: null }).name;
                    vaColumn.filter = 'statusFilter';
                    vaColumn.cellStyle = this.getStatusColor.bind(this);
                    vaColumn.getQuickFilterText = (params) => {
                        if (isNaN(parseInt(this.filterGridValue, 10))) {
                            return h.form_default.find(({ value }) => value === params.value).name;
                        } else {
                            return params.value;
                        }
                    }
                }
                if (idColumn === 'proto') {
                    vaColumn.valueFormatter = (item: any) => Functions.protoCheck(item.value).toUpperCase();
                }
                if (h.date_field) {
                    vaColumn.valueFormatter = ({ value }) =>
                        value && moment(value)
                            .format(this.dateFormat.dateTime);
                }
                vaColumn.hide = !!h.hide;
                vaColumn.suppressSizeToFit = !!h.suppressSizeToFit;

                if (h.autoheight) {
                    vaColumn.cellStyle = {
                        'white-space': 'normal',
                        'line-height': '1.2rem',
                    };
                    vaColumn.autoHeight = true;
                }
                myRemoteColumns.push(vaColumn);
            });

            this.columnDefs =
                hepVersion < 2000
                    ? this.myPredefColumns.concat(myRemoteColumns)
                    : myRemoteColumns;
            this.sizeToFit();
            this.cdr.detectChanges();
        }
        if (this.rowData?.length > 0 && this.loader) {
            this.loader = false;
            this.cdr.detectChanges();
        }
    }

    private isNewData(): boolean {
        const _md5 = Functions.md5(([
            this.queryBuilderForLoki(),
            this.isLokiQuery,
            this._dtrs.getDatesForQuery(true),
            this.config,
            this.searchQueryLoki
        ].map(i => JSON.stringify(i)).join('')));

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
        if (this.isFirstInit) {
            this.columnDefs = [];
            this.loader = true;
            this.isFirstInit = false;
        }
        this.config.timestamp = this._dtrs.getDatesForQuery(true);

        if (this.source === 'tab' || this.source === 'widget') {
            /* if ag-grid in result widget */
            this.getHeaders();
        } else {
            this.loader = true;
            this.getQueryData();
        }
        this.rowData = null;

        const checkNoData = isData => {
            // hide/show scroll bar on a bottom of grid
            const _interval = setInterval(() => {
                const el: any = document.querySelector('.ag-body-horizontal-scroll');
                if (el) {
                    el.style.display = isData ? null : 'none';
                    clearInterval(_interval);
                }
            }, 200);

        };

        if (this.isLokiQuery) {
            this._srs
                .getData(this.queryBuilderForLoki())
                .toPromise().then((result: any) => {
                    this.loader = false;
                    this.onlyLoader = false;
                    if (result === null || typeof result === 'undefined') {
                        this.rowData = [];
                        checkNoData(false);
                        this.dataReady.emit({});
                        return;
                    }
                    this.rowData = result.data.sort((a, b) => {
                        a = new Date(a.micro_ts).getTime();
                        b = new Date(b.micro_ts).getTime();
                        return a < b ? -1 : a > b ? 1 : 0;
                    });

                    this.sizeToFit();
                    if (this.rowData) {
                        /** for grid updated autoHeight and sizeToFit */
                        this.rowData = Functions.cloneObject(this.rowData);
                        checkNoData(!!this.rowData?.length);
                        this.dataReady.emit({});
                        if (this.gridApi) {
                            this.totalPages = this.gridApi.paginationGetRowCount();
                        }
                        // this.updateAgGridSizing();
                        this.cdr.detectChanges();
                    }
                }, (err) => {
                    this.rowData = [];
                    this.loader = false;
                    this.onlyLoader = false;
                    checkNoData(false);
                    this.dataReady.emit({});
                });
        } else {
            this._scs.getData(this.config).toPromise().then((result) => {
                if (!result || !result.data) {
                    this.rowData = [];
                    checkNoData(!!this.rowData?.length);
                    this.dataReady.emit({});
                    console.error(new Error(result));
                    return;
                }
                this.rowData = result.data;
                checkNoData(!!this.rowData?.length);
                if (this.rowData) {
                    this.loader = false;
                    this.onlyLoader = false;
                }
                this.sizeToFit();
                this.selectCallIdFromGetParams();
                this.openTransactionByAdvancedSettings();
                this.dataReady.emit({});
                this.updateAgGridSizing();
                if (this.gridApi) {
                    this.totalPages = this.gridApi.paginationGetRowCount();
                }
                this.cdr.detectChanges();

            }, err => {
                this.rowData = [];
                checkNoData(false);
                this.dataReady.emit({});
            });
        }
    }
    copy(e) {
        this.translateService.get('notifications.success.cellCopy').subscribe(alert => {
            this.copyService.copy(e, alert);
        });
    }
    ngAfterViewInit() {
        window.document.body.addEventListener(
            'mouseup',
            this.onSizeToFit.bind(this)
        );
        this.aliasService.getAliasFileds().then(data => {
            if (data?.length) { this.aliases = data; }
        });
    }

    onSizeToFit() {
        if (!this.gridApi || this.agGridSizeControl.selectedType !== 'sizeToFitContinuos') {
            return;
        }
        this.sizeToFit();
        this.cdr.detectChanges();
    }

    private getCallIDColor({ value }) {
        return value ? { color: Functions.getColorByString(value, 100, 25, 1, 180) } : {};
    }

    private getMethodColor({ value }) {
        return value ? { color: Functions.getMethodColor(value) } : {};
    }

    private getMosColor(params) {
        return params?.value && {
            display: 'flex',
            justifyContent: 'center',
            height: '100%',
            overflow: 'hidden',
            color: Functions.colorByMos(params.value)
        } || {};
    }

    private getStatusColor({ value }) {
        return value && { color: this.getColorByMapping(value) } || {};
    }

    private getBkgColorTable(params) {
        return {
            'background-color': this.isLokiQuery ?
                '#fff' :
                Functions.getColorByString(params.data.callid, 60, 80, 0.8)
        };
    }



    public onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        this.totalPages = this.gridApi.paginationGetRowCount();
        this.updateAgGridSizing();
        if (this.inChartContainer) {
            setTimeout(() => {
                this.generateChart();
            }, 100);
        }
    }
    paginationControls(e) {
        if (e.previousPageIndex > e.pageIndex) {
            this.gridApi.paginationGoToPreviousPage();
        } else if (e.previousPageIndex < e.pageIndex) {
            this.gridApi.paginationGoToNextPage();
        }
        if (e.pageSize !== this.agGridSizeControl.pageSize) {
            this.agGridSizeControl.pageSize = e.pageSize;
            this.gridApi.paginationSetPageSize(e.pageSize);
            let ls = getStorage(ConstValue.RESULT_GRID_SETTING);

            if (ls) {
                ls.pageSize = e.pageSize;
                setStorage(UserConstValue.RESULT_GRID_SETTING, ls);
                localStorage.removeItem(ConstValue.RESULT_GRID_SETTING);
            } else {
                ls = {
                    pageSize: e.pageSize,
                    selectedType: 'sizeToFit'
                };
                setStorage(UserConstValue.RESULT_GRID_SETTING, ls);
            }
        }
    }

    public openTransactionForSelectedRows(index, row, mouseEventData?, custom_field_name?) {
        this.openTransactionDialog({ data: row }, mouseEventData, null, null, custom_field_name);
        clearTimeout(this.copyTimeout);
    }

    public async openTransactionByProfile(row, mouseEventData?) {
        const mapping = await this._pmps.getMerged().toPromise();
        const { correlation_mapping } = mapping.find(
            i => `${i.hepid}_${i.profile}` === this.protocol_profile
        );
        const [{ uuid_field }] = correlation_mapping || [{}];
        const custom_profile: string | null = uuid_field?.profile || null;

        // console.log({ correlation_mapping, uuid_field, protocol_profile: this.protocol_profile, config: this.config });

        this.openTransactionDialog({ data: row }, mouseEventData, null, custom_profile);
    }

    public openMethodForSelectedRow(index, row, mouseEventData = null) {
        this.addWindowMessage({ data: row }, mouseEventData);
    }

    private getRequest(row, selectedRows, selectedCallId, custom_profile?, custom_field_name?) {
        const _protocol_profile = custom_profile || row?.data?.profile || this.protocol_profile;
        const sid = row.data.callid || row.data.sid;
        const tomeArray = [];
        selectedRows.forEach((i) =>
            tomeArray.push(
                ...[
                    i.cdr_start,
                    i.cdr_stop,
                    i.create_date * 1000,
                    i.update_ts,
                    i.cdr_connect,
                    i.cdr_ringing,
                ].filter((j) => !!j)
            )
        );

        const tomeArray_from = selectedRows.length
            ? Math.round(Math.min.apply(this, tomeArray) / 1000)
            : Math.round(row.data.cdr_start / 1000 || row.data.create_date);

        const tomeArray_to = selectedRows.length
            ? Math.round(Math.max.apply(this, tomeArray) / 1000)
            : Math.round(row.data.cdr_stop / 1000 || row.data.create_date);

        const request = {
            param: {
                ...Functions.cloneObject(this.config.param || ({} as any)),
                ...{
                    location: row?.data?.node ? { node: [row.data.node] } : {},
                    search: {
                        [_protocol_profile]: {
                            id: row.data.id,
                            ['callid']: selectedCallId.length > 0 ? selectedCallId : [sid],
                            // uuid: [],
                        }
                    },
                    transaction: {
                        call: !!_protocol_profile.includes('call'),
                        registration: !!_protocol_profile.includes('registration'),
                        rest: !!_protocol_profile.includes('default'),
                    }
                }
            },
            timestamp: {
                from: tomeArray_from + this.limitRange.from,
                to: tomeArray_to + this.limitRange.to,
            }
        };

        return request;
    }

    public openTransactionDialog(
        row,
        mouseEventData?,
        callisArray?,
        custom_profile?,
        custom_field_name?
    ) {
        clearTimeout(this.copyTimeout);
        // do not open duplicate window

        let sid = row.data.callid || row.data.sid;
        if (custom_profile) {
            sid += ` (${custom_profile})`;
        }
        const color = Functions.getColorByString(sid);
        const isSetWindow = this.arrWindow.find((i) => i.id === sid);
        if (isSetWindow) {
            isSetWindow.mouseEventData?.focus();
            return;
        }

        const selectedRows = this.gridApi.getSelectedRows();
        const selectedCallId =
            callisArray ||
            selectedRows
                .map((i) => i.sid)
                .reduce((a, b) => {
                    if (a.indexOf(b) === -1) {
                        a.push(b);
                    }
                    return a;
                }, []);

        /* clear from clones */
        const request = this.getRequest(row, selectedRows, selectedCallId, custom_profile, custom_field_name);

        const windowData = {
            loaded: false,
            data: null,
            titleName: custom_field_name || 'Call-ID',
            id: sid,
            mouseEventData,
            request,
            snapShotTimeRange: Functions.cloneObject(request.timestamp),
            headerColor: color || '',
        };

        this.arrWindow.push(windowData);
        this.cdr.detectChanges();
        this.fullTransactionService.getTransactionData(request, this.dateFormat.dateTimeMsZ).subscribe(data => {
            // console.log('the data', {data});
            windowData.loaded = true;
            windowData.data = data;
            this.cdr.detectChanges();
        });
    }

    closeWindow(id: number) {
        this.arrWindow.splice(id, 1);
        // console.log('this.arrWindow', this.arrWindow);
        this.cdr.detectChanges();
    }

    public addWindowMessage(row: any, mouseEventData = null, arrowMetaData: any = null) {
        if (!row?.data) {
            return;
        }
        // console.log({ row })
        const uniqueId = row?.data?.uniqueId || row?.data?.uuid || row?.data?.id;
        const isSetWindow = this.arrMessageDetail.find(
            ({ uuid }) => `${uuid}` === `${uniqueId}`
        );
        if (isSetWindow) {
            isSetWindow.mouseEventData?.focus();
            return;
        }
        const isLOG = !!(row?.data?.type === FlowItemType.LOG);
        const color = Functions.getColorByString(row.data.method || 'LOG');

        const mData = {
            loaded: false,
            arrowMetaData,
            data: {} as any,
            rowData: null, /// this.rowData as any,
            id: row.data.id ? `${row.data.id}` : `${row.data.event}`,
            uuid: uniqueId,
            headerColor: (isLOG ? 'black' : color) || '',
            mouseEventData: mouseEventData || row.data.mouseEventData,
            isBrowserWindow: arrowMetaData ? !!arrowMetaData.isBrowserWindow : false,
        };

        this.arrMessageDetail.push(mData);

        mData.data = Functions.cloneObject(row.data.item || row.data || {});
        mData.data.item = Functions.cloneObject({ raw: mData?.data?.raw || mData?.data?.message });

        /**
         *   (DECODED)
         */
        const uuid = row?.data?.item?.uuid;
        if (!isLOG && uuid) {
            const _protocol_profile = row?.data?.profile || this.protocol_profile;
            let timestamp = {
                from: row.data.micro_ts + this.limitRange.message_from, // - 1sec
                to: row.data.micro_ts + this.limitRange.message_to, // + 1sec
            };
            if (!timestamp.from || !timestamp.to) {
                timestamp = this.config.timestamp;
            }
            const _is = name => !!_protocol_profile.match(name);
            const request = {
                param: {
                    ...Functions.cloneObject(this.config.param || {}),
                    ...{
                        location: row?.data?.node ? { node: [row.data.node] } : {},
                        search: {
                            [_protocol_profile]: {
                                uuid: [uuid],
                            }
                        },
                        transaction: {
                            call: _is('call'),
                            registration: _is('registration'),
                            rest: _is('default'),
                        }
                    }
                },
                timestamp
            };

            if ((row.data?.dbnode || row.data?.node) && request.param.location?.node) {
                request.param.location.node = [row.data?.dbnode || row.data?.node];
            }

            this._scs.getDecodedData(request).toPromise().then(res => {
                const [objDecoded] = res?.data || [];
                if (objDecoded) {
                    const { decoded } = objDecoded;

                    if (decoded) {
                        const [_decoded] = decoded || [];
                        mData.data.decoded = _decoded?._source?.layers || _decoded || decoded;
                    }
                }
            }, err => { });
            /**
             * END DECODED
             */
        }
        mData.data.messageDetailTableData = Object.entries(Functions.cloneObject(mData.data))
            .filter(([name]) => !['mouseEventData', 'raw', 'item'].includes(name))
            .map(([name, value]: any[]) => {
                if (name === 'create_date') {
                    value = moment(value * 1).format(this.dateFormat.dateTime);
                }
                return { name, value };
            });

        mData.loaded = true;
        this.cdr.detectChanges();
    }

    public closeWindowMessage(id: number) {
        this.arrMessageDetail.splice(id, 1);
        this.cdr.detectChanges();
    }

    onSettingButtonClick() {
        this.dialog.open(DialogSettingsGridDialog, {
            width: '500px',
            data: {
                agGridSizeControl: this.agGridSizeControl,
                apicol: this.gridColumnApi,
                apipoint: this.gridApi,
                columns: this.context.componentParent.columnDefs,
                idParent: this.context.componentParent.id,
                protocol_id: this.localData.protocol_id
            },
        }).afterClosed().toPromise().then(() => {
            setStorage(UserConstValue.RESULT_GRID_SETTING, this.agGridSizeControl);
            this.updateAgGridSizing();
        });
    }

    export() {
        this.dialog.open(ExportDialogComponent, {
            width: '500px',
            data: {
                apicol: this.gridColumnApi,
                apipoint: this.gridApi,
                columns: this.context.componentParent.columnDefs,
                idParent: this.context.componentParent.id,
                protocol: this.protocol_profile,
                mappings: this.mappings,
                protocol_id: this.localData.protocol_id
            },
        });
    }

    generateChart(mouseEventData = null) {
        // do not open duplicate window
        const sid = 'Chart report';
        const color = Functions.getColorByString(sid);

        const windowData = {
            loaded: true,
            id: sid,
            mouseEventData: mouseEventData,
            gridApiData: {
                api: this.gridApi,
                columnApi: this.gridColumnApi,
                context: this.context,
            },
            headerColor: color || '',
        };

        this.arrChartWindow.push(windowData);
        this.cdr.detectChanges();
    }

    closeChartWindow(id: number) {
        this.arrChartWindow.splice(id, 1);
    }
    sortChanged(event) {
        const sortState = Functions.cloneObject(event.columnApi.getColumnState());
        const id = (this.id ? `-${this.id}` : '') + `-${this.localData.protocol_id}`;
        setStorage(UserConstValue.RESULT_STATE + id, sortState);
    }


    private getColorByMapping(status: number): string {
        const mappings = this._pmps.getCurrentMapping() || [{}];
        const mappingStatus: any = mappings.find(({ value }) => value === status) ||
            { color: Functions.colorsByStatus(status) };
        return mappingStatus.color;
    }

    ngOnDestroy() {
        // console.log('ngOnDestroy::', this.id);
        this.subscriptionDashboardEvent?.unsubscribe();
        this.subscriptionRangeUpdateTimeout?.unsubscribe();
        window.document.body.removeEventListener(
            'mouseup',
            this.onSizeToFit.bind(this)
        );
        try {
            const _body: any = window.document.body;
            _body?.removeAllListeners();
        } catch (e) { }

        clearInterval(this._interval);
    }

    identify(index, item) {
        return item.id;
    }

    public setAutoRefrasher(bool: boolean) {
        this.isAutoRefrasher = bool;
        this.cdr.detectChanges();
    }
    async getFormat() {
        this.dateFormat = await this._tfs.getFormat();
    }

    onCellDoubleClicked({ data, event }) {
        if (!this.isLokiQuery) {
            this.openTransactionDialog({ data }, event);
        }
    }
}
