import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { Functions } from '@app/helpers/functions';

export interface MesagesData {
    id: string;
    create_date: string;
    timeSeconds: string;
    timeUseconds: string;
    method: string;
    Msg_Size: string;
    srcIp_srcPort: string;
    srcPort: string;
    dstIp_dstPort: string;
    dstPort: string;
    proto: string;
    type: string;
    item: any;
}

@Component({
    selector: 'app-tab-messages',
    templateUrl: './tab-messages.component.html',
    styleUrls: ['./tab-messages.component.scss']
})

export class TabMessagesComponent implements OnInit {
    _dataItem: any;
    @Input() set dataItem(val) {
        this._dataItem = val;
        this.dataSource = Functions.messageFormatter(this._dataItem.data.messages);
    }
    get dataItem () {
        return this._dataItem;
    }
    @Output() messageWindow: EventEmitter<any> = new EventEmitter();

    isWindow = false;

    dataSource: Array<MesagesData> = [];
    displayedColumns: string[] = [
        'id', 'create_date', 'timeSeconds', 'diff',
        'method', 'Msg_Size',
        'srcIp_srcPort', 'dstIp_dstPort',
        // 'aliasDst', 'aliasSrc',
        'dstPort', 'proto', 'type',
    ];

    constructor() { }
    getAliasByIP (ip) {
        const alias = this.dataItem.data.alias;
        return alias[ip] || ip;
    }
    getMethodColor(method){
        return Functions.getMethodColor(method);
    }
    ngOnInit() {
        this.dataSource = Functions.messageFormatter(this.dataItem.data.messages);
    }
    onClickMessageRow(row: any, event = null) {
        row.mouseEventData = event;
        this.messageWindow.emit(row);
    }

}
