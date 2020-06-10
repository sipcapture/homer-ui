import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    AfterViewInit,
    ViewChild,
    OnDestroy,
    ElementRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
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
    _qosData: any;
    @Input() set qosData(value) {
        this._qosData = value;

        const {rtcp, rtp} = this._qosData;
        const arrRTCP = rtcp.data.map((i, key) => this.formattingQosItemAsFlowElement(i, key));
        const arrRTP = rtp.data.map((i, key) => this.formattingQosItemAsFlowElement(i, key));
        this.arrayItemsRTP_AGENT = [].concat(arrRTP);

        setTimeout(this.initData.bind(this));
        this.cdr.detectChanges();
    }
    _RTPFilterForFLOW = true;
    @Input() set RTPFilterForFLOW(val: boolean) {
        this._RTPFilterForFLOW = val;
        this.initData();
    }
    get RTPFilterForFLOW() {
        return this._RTPFilterForFLOW;
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
    @ViewChild('canvas', {static: true}) canvas: ElementRef;
    @ViewChild('downloadLink', {static: true}) downloadLink: ElementRef;
    isExport = false;
    aliasTitle: Array<any>;
    dataSource: Array<MesagesData> = [];
    arrayItems: Array<any>;
    arrayItemsRTP_AGENT: Array<any> = [];
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
    formattingQosItemAsFlowElement (item: any, pid: number) {
        item = Functions.cloneObject(item);
        item.micro_ts = item.micro_ts || (item.timeSeconds * 1000 + item.timeUseconds / 1000);
        const sIP = item.srcIp;
        const sPORT = item.srcPort;
        const dIP = item.dstIp;
        const dPORT = item.dstPort;
        const diffTs = 0;
        const protoName = Functions.protoCheck(item.proto).toUpperCase();
        const eventName = item.proto === 'rtcp' ? 'RTCP' : 'RTP';
        return {
            id: item.id,
            callid: item.sid,
            sid: item.sid,
            method_text: eventName,
            description: `${sIP}:${sPORT} -> ${dIP}:${dPORT}`,
            info_date: `[${pid}][${protoName}] ${moment(item.micro_ts).format('YYYY-MM-DD HH:mm:ss.SSS Z')}`,
            diff: `+${diffTs.toFixed(2)}ms`,
            source_ip : sIP,
            source_port : sPORT,
            srcId: `${sIP}:${sPORT}`,
            dstId: `${dIP}:${dPORT}`,
            srcIp: item.srcIp,
            srcPort: item.srcPort,
            dstIp: item.dstIp,
            dstPort: item.dstPort,
            destination_ip: dIP,
            destination_port: dPORT,
            micro_ts: (item.timeSeconds * 1000 + item.timeUseconds / 1000),
            source_data: item,
            typeItem: item.proto === 'rtcp' ? 'RTCP' : 'RTP',
            QOS: item,
            MOS: item.raw.MOS,
            __is_flow_item__: true,
            RTPmessageData: {
                id: item.id || '--',
                create_date: moment(item.micro_ts).format('YYYY-MM-DD'),
                timeSeconds: moment(item.micro_ts).format('HH:mm:ss.SSS Z'),
                diff: `${diffTs.toFixed(2)} s`,
                method: eventName,
                mcolor: Functions.getMethodColor(eventName),
                Msg_Size: item.raw ? (JSON.stringify(item.raw) + '').length : '--',
                srcIp_srcPort: `${sIP}:${sPORT}`,
                dstIp_dstPort: `${dIP}:${dPORT}`,
                dstPort: dPORT,
                proto: protoName,
                type: item.typeItem,
                item: item
            }
        };
    }
    initData() {
        this.color_sid = Functions.getColorByString(this.callid, 100, 40, 1);

        const IpList = ([].concat(...[].concat(...(this._RTPFilterForFLOW ? this.arrayItemsRTP_AGENT : []), ...this.dataItem.data.calldata)
        .map(i => [i.srcId, i.dstId]))).reduce((a, b) => {
            if (!a.includes(b)) {
                a.push(b);
            }
            return a;
        }, []);

        let hosts = Functions.cloneObject(this.dataItem.data.hosts);
        /** added host from RTP AGENT */
        if (this._RTPFilterForFLOW) {
            this.arrayItemsRTP_AGENT.forEach(item => {
                [`${item.source_ip}:${item.source_port}`, `${item.destination_ip}:${item.destination_port}`].forEach( IP_PORT => {
                    if (!hosts[IP_PORT]) {
                        hosts[IP_PORT] = {
                            host: [IP_PORT],
                            position: Object.keys(hosts).length
                        };
                    }
                });
            });
        }
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
            if (regex.exec(i) != null) {
                const IP    = regex.exec(i)[1].replace(/\[|\]/g, ''); // gives IP
                const PORT  = regex.exec(i)[2]; // gives port
                return {
                    ip: i,
                    isIPv6: IP.match(/\:/g) && IP.match(/\:/g).length > 1,
                    shortIPtext1: this.compIPV6(IP),
                    shortIPtext2: this.shortcutIPv6String(IP),
                    alias,
                    IP,
                    PORT
                };
            } else {
                // fall back to the old method if things don't work out.
                const al    = i.split(':');
                const IP    = al[0].replace(/\[|\]/g, '');
                const PORT  = al[1] ? ':' + al[1] : '';
                return {
                    ip: i,
                    shortIPtext1: this.compIPV6(IP),
                    shortIPtext2: this.shortcutIPv6String(IP),
                    isIPv6: IP.match(/\:/g) && IP.match(/\:/g).length > 1,
                    alias,
                    IP,
                    PORT
                };
            }
        });

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
                color_sid: Functions.getColorByString(i, 100, 40, 1),
                callid: i
            };
        });
        
        this.flowGridLines = Array.from({length: Object.keys(hosts).length - 1});
        const sortedArray = [].concat(
            ...(this._RTPFilterForFLOW ? this.arrayItemsRTP_AGENT : []),
            ...data.calldata)
        .sort((itemA, itemB) => {
            const a = itemA.micro_ts;
            const b = itemB.micro_ts;
            return a < b ? -1 : a > b ? 1 : 0;
        });
        this.arrayItems = sortedArray.map((item, key, arr) => {
            diffTs = key - 1 >= 0 && arr[key - 1] !== null ? (item.micro_ts - arr[key - 1].micro_ts) / 1000 : 0;

            const {min, max, abs} = Math;
            const srcPosition = hosts[item.srcId].position,
                dstPosition = hosts[item.dstId].position,
                course = srcPosition < dstPosition ? 'right' : 'left',
                position_from = min(srcPosition, dstPosition),
                position_width = abs(srcPosition - dstPosition),
                color_method = Functions.getMethodColor(item.method_text);

            const a = srcPosition;
            const b = dstPosition === a ? a + 1 : dstPosition;
            const mosColor = '';
            const isRedialArrow = srcPosition === dstPosition;
            const middle = abs(a - b);
            const options = {
                mosColor,
                color: Functions.getColorByString(item.sid, 100, 40, 1),
                start: min(a, b),
                middle,
                direction: a > b,
                rightEnd: Object.keys(hosts).length - 1 - max(a, b),
                shortdata: '',
                isRedialArrow,
                arrowStyleSolid: item.method_text === 'RTCP' || item.method_text === 'RTP'
            };
            return {
                options,
                course,
                source_data: item,
                srcPort: item.srcPort,
                dstPort: item.dstPort,
                method_text: item.method_text,
                packetType: item.method_text === 'RTCP' || item.method_text === 'RTP' ? item.method_text : 'SIP',
                ruri_user: item.ruri_user,
                id: item.id,
                color_method: color_method,
                color: Functions.getColorByString(item.sid, 100, 40, 1),
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

    onClickItem(item: any, event = null) {
        if (item.source_data.QOS) {
            const rtpROW: any = Object.assign({
                typeItem: 'RTP',
                mouseEventData: event,
            }, Functions.cloneObject(item.source_data.RTPmessageData));
            this.messageWindow.emit(rtpROW);
        } else {
            const row: any = this.dataSource.find(i => i.id === item.id) as any;
            row.mouseEventData = event;
            this.messageWindow.emit(row);
        }
    }
    compIPV6(input) {
        return input.replace(/\b(?:0+:){2,}/, ':');
    }
    shortcutIPv6String(str = '') {
        const regexp = /^\[?([\da-fA-F]+)\:.*\:([\da-fA-F]+)\]?$/g;
        const regfn = (fullstring, start, end) => `${start}:...:${end}`;
        return str.replace(regexp, regfn);
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
