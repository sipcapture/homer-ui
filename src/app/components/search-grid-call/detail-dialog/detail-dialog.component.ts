import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    HostListener,
    ElementRef,
    ViewChild,
    ChangeDetectionStrategy
} from '@angular/core';
import { Functions } from '@app/helpers/functions';
import { PreferenceAdvancedService } from '@app/services';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-detail-dialog',
    templateUrl: './detail-dialog.component.html',
    styleUrls: ['./detail-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDialogComponent implements OnInit {
    _sipDataItem: any;
    @Input() titleId: string;

    @Input() set sipDataItem(val: any) {
        this._sipDataItem = val;
        // this.restoreFiltersFromLocalStorage();
        this.changeDetectorRefs.detectChanges();
    }
    get sipDataItem() {
        return this._sipDataItem;
    }
    _headerColor: string;

    @Input() set headerColor(val: string) {
        this._headerColor = val;
        this.changeDetectorRefs.detectChanges();
    }
    get headerColor(): string {
        return this._headerColor;
    }

    @Input() mouseEventData: any;
    @Input() snapShotTimeRange: any;

    isSimplify = true;
    isSimplifyPort = true;
    isCombineByAlias = true;
    IdFromCallID;
    RTPFilterForFLOW = false;
    activeTab = 0;
    isFilterOpened = false;
    isFilterOpenedOutside = false;
    combineType = '2alias';
    listCombineTypes = {
        '1none': 'Ungrouped',
        '2alias': 'Group by Alias',
        '3port': 'Group by Ports'
    };
    tabs = {
        messages: false,
        flow: false,
        callinfo: true,
        qos: true,
        logs: true,
        export: false
    };
    searchProtocol = JSON.parse(localStorage.getItem("searchQuery")).protocol_id
    public flowFilters: any;
    exportAsPNG = false;
    isBrowserWindow = false;
    _isLoaded = false;
    checkboxListFilterPayloadType = [];
    checkboxListFilterPort = [];
    checkboxListFilterCallId = [];

    tabIndexByDefault = 0;
    _messagesBuffer: any;
    get isLoaded(): boolean {
        return this._isLoaded;
    }
    @Input('isLoaded') set isLoaded(val) {
        this._isLoaded = val;
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            if (
                this.sipDataItem.data &&
                this.sipDataItem.data.messages &&
                this.sipDataItem.data.messages[0] &&
                this.sipDataItem.data.messages[0].id
            ) {
                this.IdFromCallID = this.sipDataItem.data.messages[0].id;
            }
            this._messagesBuffer = Functions.cloneObject(this.sipDataItem.data);
            this.checkStatusTabs();

            const filterByParam = param => Object.keys(
                this.sipDataItem.data.messages
                    .map(i => i[param])
                    .reduce((a, b) => (a[b] = 1, a), {})
            ).map((i: any) => {
                const obj = {
                    selected: true,
                    title: (param === 'payloadType' ? Functions.methodCheck(null, 1 * i) : i)
                };
                obj[param] = i;
                return obj;
            });

            this.checkboxListFilterPayloadType = filterByParam('payloadType');
            this.setFiltersByAdvanced();
            const ports = [].concat(filterByParam('dstPort'), filterByParam('srcPort'));
            this.checkboxListFilterPort = Object.keys(ports
                .map(i => i.title)
                .reduce((a, b) => (a[b] = a[b] ? a[b] + 1 : 1, a), {})
            ).map(i => ({
                selected: true,
                title: i,
                port: i
            }));

            this.checkboxListFilterCallId = filterByParam('sid');
            this.changeDetectorRefs.detectChanges();

            setTimeout(() => {
                this.changeDetectorRefs.detectChanges();
            }, 35);
        }
    }

    _qosData: any;

    @Input() set qosData(value) {
        this._qosData = value;
        this.changeDetectorRefs.detectChanges();
    }
    get qosData() {
        return this._qosData;
    }


    @Output() openMessage: EventEmitter<any> = new EventEmitter();

    @Output() close: EventEmitter<any> = new EventEmitter();

    @ViewChild('filterContainer', { static: false }) filterContainer: ElementRef;
    dataLogs: Array<any>;

    constructor(
        private _pas: PreferenceAdvancedService,
        private changeDetectorRefs: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.setTabByAdvanced();
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            setTimeout(this.checkStatusTabs.bind(this));
            this.restoreFiltersFromLocalStorage();
            this.doFilterMessages();
            this.changeDetectorRefs.detectChanges();
        }
    }
    saveFiltersToLocalStorage() {
        localStorage.setItem('localFilterState', JSON.stringify({
            isSimplify: this.isSimplify,
            isSimplifyPort: this.isSimplifyPort,
            isCombineByAlias: this.isCombineByAlias,
            activeTab: this.activeTab,
            isFilterOpened: this.isFilterOpened,
            isFilterOpenedOutside: this.isFilterOpenedOutside,
            combineType: this.combineType,
            flowFilters: {
                isSimplify: this.isSimplify,
                isSimplifyPort: this.isSimplifyPort,
                isCombineByAlias: this.isCombineByAlias,
                PayloadType: this.checkboxListFilterPayloadType,
            }
        }));
    }
    getPayloadFromLocalStorage(type: string = 'RTP') {
        const defaultReturn = type === 'SIP' || type === 'SDP';
        let localFilterState: any = localStorage.getItem('localFilterState');
        if (localFilterState) {
            try {
                localFilterState = JSON.parse(localFilterState);
                const { PayloadType } = localFilterState.flowFilters;
                if (PayloadType) {
                    return (PayloadType.find(i => i.title === type) || { selected: defaultReturn }).selected;
                } else {
                    return defaultReturn;
                }
            } catch (err) {
                // localStorage.removeItem('localFilterState');
                return defaultReturn;
            }
        } else {
            return defaultReturn;
        }
    }
    restoreFiltersFromLocalStorage() {
        // ** test function */ this.getPayloadFromLocalStorage('RTP');

        /** restore from localStorage */
        let localFilterState: any = localStorage.getItem('localFilterState');
        if (localFilterState) {
            try {
                localFilterState = JSON.parse(localFilterState);
                this.combineType = localFilterState.combineType;
                this.isSimplify = localFilterState.isSimplify;
                this.isSimplifyPort = localFilterState.isSimplifyPort;
                this.isCombineByAlias = localFilterState.isCombineByAlias;
                this.isFilterOpenedOutside = localFilterState.isFilterOpenedOutside;
                this.combineType = localFilterState.combineType;

                this.flowFilters = this.flowFilters || {};
                this.flowFilters.isSimplify = localFilterState.flowFilters.isSimplify;
                this.flowFilters.isSimplifyPort = localFilterState.flowFilters.isSimplifyPort;
                this.flowFilters.isCombineByAlias = localFilterState.flowFilters.isCombineByAlias;
                if (
                    this.flowFilters.PayloadType &&
                    this.flowFilters.PayloadType instanceof Array &&
                    localFilterState.flowFilters.PayloadType &&
                    localFilterState.flowFilters.PayloadType instanceof Array
                ) {
                    this.flowFilters.PayloadType.forEach(i => {
                        const localitem = localFilterState.flowFilters.PayloadType.find(j => j.title === i.title);
                        if (localitem) {
                            i.selected = localitem.selected;
                        }
                    });
                } else {
                    this.flowFilters.PayloadType = localFilterState.flowFilters.PayloadType;
                }

                this.flowFilters.PayloadTypeMetricChart = localFilterState.flowFilters.PayloadTypeMetricChart;
                setTimeout(() => {
                    /** refresh checkboxes */
                    this.checkboxListFilterPayloadType = this.flowFilters.PayloadType;
                    this.changeDetectorRefs.detectChanges();
                }, 35);

                this.changeDetectorRefs.detectChanges();
            } catch (err) {
                console.error(new Error(err));
                localStorage.removeItem('localFilterState');
            }

        }
    }
    checkStatusTabs() {
        //   this.tabs.logs = true; // this.dataLogs.length > 0;
        let callData = this.sipDataItem.data.calldata
        this.tabs.logs = callData.some(f => f.method === "LOG" || f.method === "100")
        this.tabs.messages = this.tabs.flow = this.sipDataItem.data.messages.length > 0;
        this.tabs.callinfo = this.sipDataItem.data.messages.length > 0 && (this.searchProtocol === "1_call" || this.searchProtocol === "1_registration");
        this.tabs.export = this.sipDataItem.data.messages && !!this.IdFromCallID;
        this.changeDetectorRefs.detectChanges();
    }
    onTabQos(isVisible: boolean) {
        setTimeout(() => {
            this.tabs.qos = isVisible;
            if (isVisible) {
                const isRTP = this._qosData && this._qosData.rtp && this._qosData.rtp.data && this._qosData.rtp.data.length > 0;
                if (isRTP) {
                    this.checkboxListFilterPayloadType.push({
                        payloadType: '5',
                        selected: true,
                        title: 'RTP'
                    });
                    this.doFilterMessages();
                    this.changeDetectorRefs.detectChanges();
                }
            }
            this.changeDetectorRefs.detectChanges();
        }, 0);
        this.tabs.qos = isVisible;
        this.changeDetectorRefs.detectChanges();
    }
    onClose() {
        this.close.emit();
        this.changeDetectorRefs.detectChanges();
    }

    addWindow(data: any) {
        if (data.method === 'LOG' || data.typeItem === 'RTP') {
            this.openMessage.emit({
                data: data,
                isLog: true,
                isBrowserWindow: this.isBrowserWindow
            });
        } else {
            data.item.mouseEventData = data.mouseEventData;
            this.openMessage.emit({
                data: data.item,
                isBrowserWindow: this.isBrowserWindow
            });
        }
        this.changeDetectorRefs.detectChanges();
    }

    onBrowserWindow(event) {
        this.isBrowserWindow = event;
        this.changeDetectorRefs.detectChanges();
    }
    setFiltersByAdvanced() {
        this._pas.getAll().toPromise().then(advanced => {
            if (advanced && advanced.data) {
                try {
                    const params = Functions.getUriJson();
                    const category = params && params.param ? 'export' : 'search';
                    const setting = advanced.data.filter(i => i.category === category && i.param === 'transaction');
                    if (setting && setting[0] && setting[0].data) {
                        const filters = setting[0].data.tabfilterconfig;
                        const filterBackup = Functions.cloneObject(this.checkboxListFilterPayloadType);
                        if (this.checkboxListFilterPayloadType.length > 1) {
                            this.checkboxListFilterPayloadType.forEach(filter => {
                                filter.selected = filters[filter.title];
                            });
                        }
                        if (this.checkboxListFilterPayloadType.every(filter => filter.selected === false)) {
                            this.checkboxListFilterPayloadType = filterBackup;
                        }
                        this.doFilterMessages();
                        this.changeDetectorRefs.detectChanges();
                    }
                } catch (err) { }
            }
        });
    }
    setTabByAdvanced() {
        this._pas.getAll().toPromise().then(advanced => {
            if (advanced && advanced.data) {
                try {
                    const params = Functions.getUriJson();
                    const category = params && params.param ? 'export' : 'search';
                    const setting = advanced.data.filter(i => i.category === category && i.param === 'transaction');
                    if (setting && setting[0] && setting[0].data) {
                        const { tabpositon } = setting[0].data;
                        if (tabpositon && typeof tabpositon === 'string' && tabpositon !== '') {
                            this.tabIndexByDefault = Object.keys(this.tabs).indexOf(tabpositon);
                            this.activeTab = this.tabIndexByDefault;
                            this.restoreFiltersFromLocalStorage();
                            this.changeDetectorRefs.detectChanges();
                        }
                        this.doFilterMessages();
                    }
                } catch (err) { }
            }
        });
    }

    onExportFlowAsPNG() {
        this.exportAsPNG = true;
        this.changeDetectorRefs.detectChanges();
    }
    doFilterMessages() {
        if (!this.sipDataItem) {
            return;
        }
        this.changeDetectorRefs.detectChanges();
        if (this.combineType === '1none') {
            this.isCombineByAlias = false;
            this.isSimplifyPort = false;
        } else if (this.combineType === '2alias') {
            this.isCombineByAlias = true;
            this.isSimplifyPort = true;
        } else if (this.combineType === '3port') {
            this.isCombineByAlias = false;
            this.isSimplifyPort = true;
        }
        setTimeout(() => {
            const fc = Functions.cloneObject;
            this.sipDataItem.data.messages = fc(this._messagesBuffer).messages.filter(i => {
                const boolPayloadType =
                    this.checkboxListFilterPayloadType.filter(j => j.payloadType * 1 === i.payloadType * 1 && j.selected).length > 0;

                const boolPort =
                    this.checkboxListFilterPort.filter(j => i.srcPort * 1 === j.port * 1 && j.selected).length > 0 &&
                    this.checkboxListFilterPort.filter(j => i.dstPort * 1 === j.port * 1 && j.selected).length > 0;

                const boolCallId =
                    this.checkboxListFilterCallId.filter(j => j.sid === i.sid && j.selected).length > 0;

                return boolPayloadType && boolPort && boolCallId;
            });

            const RTPFilter = this.checkboxListFilterPayloadType.find(i => i.title === 'RTP');
            this.RTPFilterForFLOW = RTPFilter && RTPFilter.selected || false;

            const selectedId = this.sipDataItem.data.messages.map(i => i.id);

            this.sipDataItem.data.calldata = fc(this._messagesBuffer).calldata.filter(i => selectedId.includes(i.id));
            this.sipDataItem = Functions.cloneObject(this.sipDataItem); // refresh data
            this.flowFilters = {
                isSimplify: this.isSimplify,
                isSimplifyPort: this.isSimplifyPort,
                isCombineByAlias: this.isCombineByAlias,
                PayloadType: this.checkboxListFilterPayloadType,
                CallId: this.checkboxListFilterCallId
            };
            this.saveFiltersToLocalStorage();
            this.changeDetectorRefs.detectChanges();
        });
    }
    selectedIndexChange(event) {
        this.activeTab = event;
        this.changeDetectorRefs.detectChanges();
    }
    doOpenFilter() {
        setTimeout(() => {
            this.isFilterOpened = true;
            this.changeDetectorRefs.detectChanges();
        });
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement) {
        if (this.filterContainer && this.filterContainer.nativeElement) {
            const clickedInside = this.filterContainer.nativeElement.contains(targetElement);
            if (!clickedInside && this.isFilterOpened) {
                this.isFilterOpened = false;
                this.changeDetectorRefs.detectChanges();
            }
        }
    }
}
