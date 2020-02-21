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
    checkboxListFilter = [];
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
            this.checkboxListFilter = Object.keys(this.sipDataItem.data.messages
                .map(i => i.payloadType).reduce((a, b) => (a[b] = 1, a), {})).map((i: any) => ({
                    payloadType: i * 1,
                    selected: true,
                    title: Functions.methodCheck(null, i * 1)
                }));
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
            this.sipDataItem.data.messages = this._messagesBuffer.messages.filter(i => {
                return this.checkboxListFilter.filter(j => j.payloadType === i.payloadType && j.selected).length > 0;
            });
            const selectedId = this.sipDataItem.data.messages.map(i => i.id);
            this.sipDataItem.data.calldata = this._messagesBuffer.calldata.filter(i => selectedId.includes(i.id));

            this.sipDataItem = Functions.cloneObject(this.sipDataItem); // refresh data
           // this.isFilterOpened = false;
        }, 100);
    }

    doOpenFilter() {
        setTimeout(() => {
            this.isFilterOpened = true;
        }, 10);
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement) {
        console.log('this.isFilterOpened', this.isFilterOpened);

        if (this.filterContainer && this.filterContainer.nativeElement) {
            const clickedInside = this.filterContainer.nativeElement.contains(targetElement);
            if (!clickedInside && this.isFilterOpened) {
                this.isFilterOpened = false;
            }
        }
    }
}
