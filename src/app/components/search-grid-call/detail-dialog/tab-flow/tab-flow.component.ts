import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { MesagesData } from '../tab-messages/tab-messages.component';
import { Functions } from '../../../../helpers/functions';

@Component({
    selector: 'app-tab-flow',
    templateUrl: './tab-flow.component.html',
    styleUrls: ['./tab-flow.component.css']
})
export class TabFlowComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('flowtitle', {static: false}) flowtitle;
    @ViewChild('flowpage', {static: false}) flowpage;
    @Input() callid: any;
    @Input() dataItem: any;
    @Output() messageWindow: EventEmitter<any> = new EventEmitter();

    aliasTitle: Array<any>;
    dataSource: Array<MesagesData> = [];
    arrayItems: Array<any>;
    color_sid: string;
    _interval: any;
    labels: Array<any> = [];
    constructor() { }

    ngAfterViewInit() {
        const self = this;
        if (!this._interval) {
            this._interval = setInterval(() => {
                try {
                    const wftc = self.flowpage.nativeElement.parentElement.parentElement;
                    self.flowtitle.nativeElement.style.left = -wftc.scrollLeft + 'px';
                } catch (e) { }
            } , 20); // 60 fps
        }
    }
    ngOnDestroy () {
        clearInterval(this._interval);
    }
    ngOnInit() {
        this.color_sid = Functions.getColorByString(this.callid);

        /* sort it */
        this.dataItem.data.hosts = this.sortProperties(this.dataItem.data.hosts, 'position', true, false);

        this.aliasTitle = Object.keys(this.dataItem.data.hosts).map( i => ({ ip: i, alias: this.dataItem.data.alias[i] }));
        const colCount = this.aliasTitle.length;
        const data = this.dataItem.data;
        let diffTs = 0;
        this.labels = data.calldata.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []).map(i => {
            return {
                color_sid: Functions.getColorByString(i),
                callid: i
            }
        });
        this.arrayItems = data.calldata.map((item, key, arr) => {
            diffTs = key - 1 >= 0 && arr[key - 1] !== null ? (item.micro_ts - arr[key - 1].micro_ts) / 1000 : 0;

            const srcPosition = data.hosts[item.srcId].position,
                dstPosition = data.hosts[item.dstId].position,
                course = srcPosition < dstPosition ? 'right' : 'left',
                position_from = Math.min(srcPosition, dstPosition),
                position_width = Math.abs(srcPosition - dstPosition),
                color_method = Functions.getColorByString(item.method_text);

            return {
                course : course,
                method_text: item.method_text,
                ruri_user: item.ruri_user,
                id: item.id,
                color_method: color_method,
                color: Functions.getColorByString(item.sid),
                micro_ts: moment( item.micro_ts ).format('YYYY-MM-DD HH:mm:ss.sss Z'),
                diffTs: diffTs.toFixed(2),
                proto: Functions.protoCheck(item.protocol),
                style: {
                    left: position_from / colCount * 100,
                    width: position_width / colCount * 100
                }
            };
        });
        this.dataSource = Functions.messageFormatter(this.dataItem.data.messages);
    }

    onClickItem(id: any) {
        const row = this.dataSource.filter(i => i.id === id)[0];
        this.messageWindow.emit(row);
    }

    /**
    * Sort object properties (only own properties will be sorted).
    * @param {object} obj object to sort properties
    * @param {string|int} sortedBy 1 - sort object properties by specific value.
    * @param {bool} isNumericSort true - sort object properties as numeric value, false - sort as string value.
    * @param {bool} reverse false - reverse sorting.
    * @returns {Array} array of items in [[key,value],[key,value],...] format.
    */
    sortProperties(obj, sortedBy, isNumericSort, reverse) {
            sortedBy = sortedBy || 1; // by default first key
            isNumericSort = isNumericSort || false; // by default text sort
            reverse = reverse || false; // by default no reverse

            var reversed = (reverse) ? -1 : 1;

            var sortable = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sortable.push([key, obj[key]]);
                }
            }
            if (isNumericSort)
                sortable.sort(function (a, b) {
                    return reversed * (a[1][sortedBy] - b[1][sortedBy]);
                });
            else
                sortable.sort(function (a, b) {
                    var x = a[1][sortedBy].toLowerCase(),
                        y = b[1][sortedBy].toLowerCase();
                    return x < y ? reversed * -1 : x > y ? reversed : 0;
                });
            return sortable.reduce((obj, item) => {
              obj[item[0]] = item[1]
              return obj
            }, {})
    }
}
