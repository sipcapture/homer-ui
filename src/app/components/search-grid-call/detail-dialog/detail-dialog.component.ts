import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Functions } from '../../../helpers/functions';

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
    tabs = {
        messages: false,
        flow: false,
        qos: true,
        logs: false,
        export: false
    };
    isBrowserWindow = false;
    _isLoaded = false;
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

    constructor() { }

    ngOnInit () {
        if (this.sipDataItem) {
            this.dataLogs = this.sipDataItem.data.messages.filter(i => !i.method).map(i => ({ payload: i }));
            this.checkStatusTabs();
        }
    }
    checkStatusTabs() {
        this.tabs.logs = this.dataLogs.length > 0;
        this.tabs.messages = this.tabs.flow = this.sipDataItem.data.messages.length > 0;
        this.tabs.export = this.sipDataItem.data.messages && !!this.sipDataItem.data.messages[0].id;
    }
    onTabQos(isVisible: boolean) {
        this.tabs.qos = isVisible;
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
}
