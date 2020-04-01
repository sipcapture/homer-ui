import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Functions } from '../../../helpers/functions';
import { PreferenceAdvancedService } from '@app/services';

@Component({
    selector: 'app-detail-dialog',
    templateUrl: './detail-dialog.component.html',
    styleUrls: ['./detail-dialog.component.css']
})
export class DetailDialogComponent implements OnInit {
    @Input() titleId: string;
    @Input() sipDataItem: any;
    @Input() qosData: any;
    @Input() headerColor: any;
    @Input() mouseEventData: any;
    @Input() snapShotTimeRange: any;
    isSimplify = true;
    isSimplifyPort = true;
    IdFromCallID;
    activeTab = 0;
    isFilterOpened = false;
    isFilterOpenedOutside = false;
    tabs = {
        messages: false,
        flow: false,
        qos: true,
        logs: true,
        export: false
    };
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
            const ports = [].concat(filterByParam('dstPort'), filterByParam('srcPort'));
            this.checkboxListFilterPort = Object.keys(ports
                    .map(i => i.title )
                    .reduce((a, b) => (a[b] = a[b] ? a[b] + 1 : 1, a), {})
                ).map(i => ({
                    selected: true,
                    title: i,
                    port: i
                }));

            this.checkboxListFilterCallId = filterByParam('sid');
        }
    }

    @Output() openMessage: EventEmitter<any> = new EventEmitter();
    @Output() close: EventEmitter<any> = new EventEmitter();
    @ViewChild('filterContainer', {static: false}) filterContainer: ElementRef;
    dataLogs: Array<any>;
    
    constructor(
        private _pas: PreferenceAdvancedService
    ) { }

    ngOnInit () {
        this.setTabByAdvanced();
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            setTimeout(this.checkStatusTabs.bind(this));
        }
    }
    checkStatusTabs() {
        this.tabs.logs = true; // this.dataLogs.length > 0;
        this.tabs.messages = this.tabs.flow = this.sipDataItem.data.messages.length > 0;
        this.tabs.export = this.sipDataItem.data.messages && !!this.IdFromCallID;
    }
    onTabQos(isVisible: boolean) {
        setTimeout(() => {
            this.tabs.qos = isVisible;
        });
    }
    onClose () {
        this.close.emit();
    }

    addWindow(data: any) {
        if (data.method === 'LOG') {
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
    }

    onBrowserWindow (event) {
        this.isBrowserWindow = event;
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
                        }
                    }
                } catch (err) { }
            }
        });
    }

    onExportFlowAsPNG() {
        this.exportAsPNG = true;
        setTimeout(() => { this.exportAsPNG = false; });
    }
    doFilterMessages() {
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
            const selectedId = this.sipDataItem.data.messages.map(i => i.id);

            this.sipDataItem.data.calldata = fc(this._messagesBuffer).calldata.filter(i => selectedId.includes(i.id));
            this.sipDataItem = Functions.cloneObject(this.sipDataItem); // refresh data
        }, 100);
    }

    doOpenFilter() {
        setTimeout(() => {
            this.isFilterOpened = true;
        }, 10);
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement) {
        if (this.filterContainer && this.filterContainer.nativeElement) {
            const clickedInside = this.filterContainer.nativeElement.contains(targetElement);
            if (!clickedInside && this.isFilterOpened) {
                this.isFilterOpened = false;
            }
        }
    }
}
