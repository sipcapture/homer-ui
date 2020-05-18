import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, OnDestroy, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';
import { MesagesData } from '../tab-messages/tab-messages.component';
import { Functions } from '../../../../helpers/functions';
import * as html2canvas from 'html2canvas';

@Component({
    selector: 'app-tab-flow',
    templateUrl: './tab-flow.component.html',
    styleUrls: ['./tab-flow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabFlowComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('flowtitle', {static: false}) flowtitle;
    _isSimplify = false;

    @Input()
    set isSimplify(val: boolean) {
        this._isSimplify = val;
        this.cdr.detectChanges();
    }
    get isSimplify() {
        return this._isSimplify;
    }

    _isSimplifyPort = false;
    _flagAfterViewInit = false;
    @Input()
    set isSimplifyPort(val: boolean) {
        this._isSimplifyPort = val;
        this.cdr.detectChanges();
    }
    get isSimplifyPort() {
        return this._isSimplifyPort;
    }

    @Input() callid: any;
    _dataItem: any;
    @Input() set dataItem(val) {
        this._dataItem = val;
        setTimeout(this.initData.bind(this));
        this.cdr.detectChanges();
    }
    get dataItem () {
        return this._dataItem;
    }
    @Input() set exportAsPNG(val) {
        if (val) {
            this.isExport = true;
            this.cdr.detectChanges();
            setTimeout(() => {
                this.onSavePng();
            }, 500);
        }
    }
    @Output() messageWindow: EventEmitter<any> = new EventEmitter();

    @ViewChild('flowpage', {static: true}) flowpage: ElementRef;
    @ViewChild('flowscreen', {static: true}) flowscreen: ElementRef;
    // </div>
    @ViewChild('canvas', {static: true}) canvas: ElementRef;
    @ViewChild('downloadLink', {static: true}) downloadLink: ElementRef;
    isExport = false;
    aliasTitle: Array<any>;
    dataSource: Array<MesagesData> = [];
    arrayItems: Array<any>;
    color_sid: string;
    _interval: any;
    labels: Array<any> = [];
    flowGridLines = [];
    constructor(private cdr: ChangeDetectorRef) { }

    ngAfterViewInit() {
        this._flagAfterViewInit = true;
    }
    ngOnDestroy () {
        clearInterval(this._interval);
    }
    ngOnInit() {
        this.initData();
    }
    initData() {
        this.color_sid = Functions.getColorByString(this.callid);

        const IpList = ([].concat(...this.dataItem.data.calldata.map(i => [i.srcId, i.dstId]))).reduce((a, b) => {
            if (!a.includes(b)) {
                a.push(b);
            }
            return a;
        }, []);

        let hosts = Functions.cloneObject(this.dataItem.data.hosts);

        /* sort it */
        hosts = this.sortProperties(hosts, 'position', true, false);

        let increment = 0;
        Object.keys(hosts).map(i => {
            if (!IpList.includes(i)) {
                delete hosts[i];
            } else {
                hosts[i].position = increment;
                increment++;
            }
        });

        this.aliasTitle = Object.keys(hosts).map( i => {
            const alias = this.dataItem.data.alias[i];
            // This is where the GUI splits port from IP Address. 
            // Note: not perfect. It works 'backwards' from the end of the string
            // If last IPv6 block has letters and digits, and there is no port, then
            // the regexp will fail, and result in null. This is a 'best' effort
            const regex = RegExp('(.*(?!$))(?::)([0-9]+)?$');
            if(regex.exec(i) != null){
                const IP    = regex.exec(i)[1] // gives IP
                const PORT  = regex.exec(i)[2] // gives port
                return { ip: i, alias, IP, PORT };
            } else {
                // fall back to the old method if things don't work out.
                const al    = i.split(':');
                const IP    = al[0];
                const PORT  = al[1] ? ':' + al[1] : '';
                return { ip: i, alias, IP, PORT };
            }
        });

        console.log('aliasTitle:', this.aliasTitle);

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
        this.flowGridLines = Array.from({length: Object.keys(hosts).length - 1});
        this.arrayItems = data.calldata.map((item, key, arr) => {
            console.log({item});
            diffTs = key - 1 >= 0 && arr[key - 1] !== null ? (item.micro_ts - arr[key - 1].micro_ts) / 1000 : 0;
            const {min, max, abs} = Math;
            const srcPosition = hosts[item.srcId].position,
                dstPosition = hosts[item.dstId].position,
                course = srcPosition < dstPosition ? 'right' : 'left',
                position_from = min(srcPosition, dstPosition),
                position_width = abs(srcPosition - dstPosition),
                color_method = Functions.getColorByString(item.method_text);

            const a = srcPosition;
            const b = dstPosition;
            const mosColor = '';
            const options = {
                mosColor,
                color: Functions.getColorByString(item.sid),
                start: min(a, b),
                middle: abs(a - b) || 1,
                direction: a > b,
                rightEnd: Object.keys(hosts).length - 1 - max(a, b),
                shortdata: '',
                arrowStyleSolid: item.method_text === 'RTCP'
            };
            return {
                options,
                course,
                srcPort: item.srcPort,
                dstPort: item.dstPort,
                method_text: item.method_text,
                ruri_user: item.ruri_user,
                id: item.id,
                color_method: color_method,
                color: Functions.getColorByString(item.sid),
                micro_ts: moment( item.micro_ts).format('YYYY-MM-DD HH:mm:ss.SSS Z'),
                diffTs: diffTs.toFixed(3),
                proto: Functions.protoCheck(item.protocol),
                style: {
                    left: position_from / colCount * 100,
                    width: position_width / colCount * 100
                }
            };
        });
        this.dataSource = Functions.messageFormatter(this.dataItem.data.messages);
        this.cdr.detectChanges();
    }

    onClickItem(id: any, event = null) {
        const row: any = this.dataSource.filter(i => i.id === id)[0];
        row.mouseEventData = event;
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
    sortProperties(obj: any, sortedBy: any = 1, isNumericSort = false, reverse = false) {
        const reversed = (reverse) ? -1 : 1;
        const sortable = [];

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sortable.push([key, obj[key]]);
            }
        }
        if (isNumericSort) {
            sortable.sort(function (a, b) {
                return reversed * (a[1][sortedBy] - b[1][sortedBy]);
            });
        } else {
            sortable.sort(function (a, b) {
                const x = a[1][sortedBy].toLowerCase();
                const y = b[1][sortedBy].toLowerCase();
                return x < y ? reversed * -1 : x > y ? reversed : 0;
            });
        }

        return sortable.reduce((target, item) => {
            target[item[0]] = item[1];
            return target;
        }, {});
    }

    onSavePng() {
        if (!this._flagAfterViewInit) {
            console.log('waiting FLOW before save a PNG');
            setTimeout(this.onSavePng.bind(this), 1000);
            return;
        }
        if (html2canvas && typeof html2canvas === 'function') {
            const f: Function = html2canvas as Function;
            f(this.flowscreen.nativeElement).then(canvas => {
                this.canvas.nativeElement.src = canvas.toDataURL();
                this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
                this.downloadLink.nativeElement.download = `${this.callid}.png`;
                this.downloadLink.nativeElement.click();
            });
        }
    }
}
