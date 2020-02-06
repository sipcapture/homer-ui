import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
    tabIndexByDefault = 0;
    get isLoaded(): boolean {
        return this._isLoaded;
    }
    @Input('isLoaded') set isLoaded(val) {
        this._isLoaded = val;
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            this.checkStatusTabs();
        }
    }

    @Output() openMessage: EventEmitter<any> = new EventEmitter();
    @Output() close: EventEmitter<any> = new EventEmitter();

    dataLogs: Array<any>;

    constructor(
        private _pas: PreferenceAdvancedService
    ) { }

    ngOnInit () {
        this.setTabByAdvenced();
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            setTimeout(this.checkStatusTabs.bind(this));
        }
    }
    checkStatusTabs() {
        this.tabs.logs = true; // this.dataLogs.length > 0;
        this.tabs.messages = this.tabs.flow = this.sipDataItem.data.messages.length > 0;
        this.tabs.export = this.sipDataItem.data.messages && !!this.sipDataItem.data.messages[0].id;
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

    setTabByAdvenced() {
        this._pas.getAll().toPromise().then(advenced => {
            if (advenced && advenced.data) {
                try {
                    const params = Functions.getUriJson();
                    const category = params && params.param ? 'export' : 'search';
                    const setting = advenced.data.filter(i => i.category === category && i.param === 'transaction');
                    if (setting && setting[0] && setting[0].data) {
                        const { tabpositon } = setting[0].data;
                        if (tabpositon && typeof tabpositon === 'string' && tabpositon !== '') {
                            this.tabIndexByDefault = Object.keys(this.tabs).indexOf(tabpositon);
                        }
                    }
                } catch (err) { }
            }
        });
    }

    onExportFlowAsPNG() {
        this.exportAsPNG = true;
        setTimeout(()=> {this.exportAsPNG = false});
    }
}
