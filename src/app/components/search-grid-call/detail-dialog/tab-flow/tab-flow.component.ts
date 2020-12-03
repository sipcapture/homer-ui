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
    ChangeDetectorRef,
    ViewEncapsulation
} from '@angular/core';
import * as moment from 'moment';
import { MesagesData } from '../tab-messages/tab-messages.component';
import { Functions } from '../../../../helpers/functions';
import * as html2canvas from 'html2canvas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkVirtualScrollViewport, FixedSizeVirtualScrollStrategy, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';

export class CustomVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
    constructor() {
        super(50, 250, 500);
    }
}

enum FlowItemType {
    SIP = 'SIP',
    SDP = 'SDP',
    RTP = 'RTP',
    RTCP = 'RTCP'
}

@Component({
    selector: 'app-tab-flow',
    templateUrl: './tab-flow.component.html',
    styleUrls: ['./tab-flow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: VIRTUAL_SCROLL_STRATEGY, useClass: CustomVirtualScrollStrategy }]

})
export class TabFlowComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('flowtitle', { static: false }) flowtitle;
    @ViewChild('virtualScroll') virtualScroll: CdkVirtualScrollViewport;
    @ViewChild('virtualScrollbar') virtualScrollbar: ElementRef;
    @Input()
    set isSimplify(val: boolean) {
        this._isSimplify = val;
        this.cdr.detectChanges();
    }
    get isSimplify() {
        return this._isSimplify;
    }
    _qosData: any;
    _flagAfterViewInit = false;
    _isSimplify = false;
    public _isSimplifyPort = false;
    public _isCombineByAlias = true;
    private _dataItem: any;
    flowGridLines = [];
    isExport = false;
    hosts: Array<any>;
    arrayItems: Array<any> = [];
    color_sid: string;
    labels: Array<any> = [];
    private scrollFlag = 0;
    private ScrollTarget: string;
    @Input() set flowFilters(filters: any) {
        if (!filters) {
            return;
        }
        this._isSimplifyPort = filters.isSimplifyPort;
        this._isCombineByAlias = filters.isCombineByAlias;
        setTimeout(this.initData.bind(this));
    }

    @Input() callid: any;

    @Input() set dataItem(dataItemValue) {
        this._dataItem = dataItemValue;
        setTimeout(this.initData.bind(this));
    }
    get dataItem() {
        return this._dataItem;
    }
    @Input() set qosData(value) {
        if (!value) {
            return;
        }
        this._qosData = value;
        const { rtp } = this._qosData;
        const arrRTP = rtp.data.map((i, key) => this.formattingQosItemAsFlowElement(i, key));
        this.arrayItemsRTP_AGENT = [].concat(arrRTP);
        setTimeout(this.initData.bind(this));
    }
    _RTPFilterForFLOW = false;
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
            setTimeout(this.onSavePng.bind(this), 500);
        }
    }

    get pageWidth() {
        return (this.isSimplify ? 150 : 200) * this.flowGridLines.length;
    }
    @Output() messageWindow: EventEmitter<any> = new EventEmitter();
    @Output() pngReady: EventEmitter<any> = new EventEmitter();

    @ViewChild('flowpage', { static: true }) flowpage: ElementRef;
    @ViewChild('flowscreen', { static: true }) flowscreen: ElementRef;
    @ViewChild('canvas', { static: true }) canvas: ElementRef;
    @ViewChild('downloadLink', { static: true }) downloadLink: ElementRef;

    aliasTitle: Array<any>;
    dataSource: Array<MesagesData> = [];
    arrayItemsRTP_AGENT: Array<any> = [];
    _interval: any;

    constructor(private cdr: ChangeDetectorRef, private _snackBar: MatSnackBar) { }

    ngAfterViewInit() {
        this._flagAfterViewInit = true;
    }
    ngOnDestroy() {
        clearInterval(this._interval);
    }
    ngOnInit() {
        this.initData();
        this.virtualScroll.setRenderedContentOffset(1);
    }
    formattingQosItemAsFlowElement(item: any, pid: number) {
        item = Functions.cloneObject(item);
        item.micro_ts = item.micro_ts || (item.timeSeconds * 1000 + item.timeUseconds / 1000);
        const sIP = item.srcIp;
        const sPORT = item.srcPort;
        const dIP = item.dstIp;
        const dPORT = item.dstPort;
        const diffTs = 0;
        const protoName = Functions.protoCheck(item.proto).toUpperCase();
        const eventName = item.proto === 'rtcp' ? 'RTCP' : 'RTP';
        const typeItem = item.proto === 'rtcp' ? 'RTCP' : 'RTP';
        return {
            id: item.id,
            callid: item.sid,
            sid: item.sid,
            method_text: eventName,
            ruri_user: `${sIP}:${sPORT} -> ${dIP}:${dPORT}`,
            info_date: `[${pid}][${protoName}] ${moment(item.micro_ts).format('YYYY-MM-DD HH:mm:ss.SSS Z')}`,
            diff: `+${diffTs.toFixed(2)}ms`,
            source_ip: sIP,
            source_port: sPORT,
            srcId: item.srcId || `${sIP}:${sPORT}`,
            dstId: item.dstId || `${dIP}:${dPORT}`,
            srcIp: item.srcIp,
            srcPort: item.srcPort,
            dstIp: item.dstIp,
            dstPort: item.dstPort,
            destination_ip: dIP,
            destination_port: dPORT,
            micro_ts: (item.timeSeconds * 1000 + item.timeUseconds / 1000),
            source_data: item,
            typeItem,
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
                type: typeItem,
                item: item
            }
        };
    }
    initData() {
        this.color_sid = Functions.getColorByString(this.callid, 100, 40, 1);

        let hosts = Functions.cloneObject(this.dataItem.data.hosts);
        /** added host from RTP AGENT */
        if (this._RTPFilterForFLOW) {
            this.arrayItemsRTP_AGENT.forEach(item => {
                [`${item.source_ip}:${item.source_port}`, `${item.destination_ip}:${item.destination_port}`]
                    .forEach(IP_PORT => {
                        if (!hosts[IP_PORT]) {
                            hosts[IP_PORT] = {
                                host: [IP_PORT],
                                position: Object.keys(hosts).length
                            };
                        }
                    });
            });
        }
        const data = this.dataItem.data;
        const sortedArray: Array<any> = [].concat(
            ...(this._RTPFilterForFLOW ? this.arrayItemsRTP_AGENT : []),
            ...data.calldata)
            .sort((itemA, itemB) => {
                const a = itemA.micro_ts;
                const b = itemB.micro_ts;
                return a < b ? -1 : a > b ? 1 : 0;
            });

        const IpList: Array<any> = [].concat(...sortedArray.map(i => [i.srcId, i.dstId])).reduce((arr, b) => {
            const _ip = this._isSimplifyPort ? b.match(/\d+$|(\[.*\]|\d+\.\d+\.\d+\.\d+)/g)[0] : b;
            if (!arr.includes(_ip)) {
                arr.push(_ip);
            }
            return arr;
        }, []);
        if (this._isSimplifyPort) {
            const hostNoPortsArray: Array<any> = Object.keys(hosts).sort()
                .map(i => i.match(/\d+$|(\[.*\]|\d+\.\d+\.\d+\.\d+)/g))
                .filter((i, k, a) => {
                    if (a[k - 1]) {
                        return a[k - 1][0] !== i[0];
                    }
                    return true;
                }).map(i => i.join(':'));
            const filterdHostd: any = hostNoPortsArray.reduce((a, b) => {
                const _ip = this._isSimplifyPort ? b.match(/\d+$|(\[.*\]|\d+\.\d+\.\d+\.\d+)/g)[0] : b;
                a[_ip] = hosts[b];
                return a;
            }, {});

            hosts = filterdHostd;
        }

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

        this.aliasTitle = Object.keys(hosts).map(i => {
            const __alias = Object.entries(this.dataItem.data.alias).find(j => j[0].startsWith(i + ':'));
            const alias = this.dataItem.data.alias[i] || (__alias && __alias[1]);
            // This is where the GUI splits port from IP Address.
            // Note: not perfect. It works 'backwards' from the end of the string
            // If last IPv6 block has letters and digits, and there is no port, then
            // the regexp will fail, and result in null. This is a 'best' effort
            const regex = RegExp('(.*(?!$))(?::)([0-9]+)?$');
            let IP, PORT;
            if (regex.exec(i) != null) {
                IP = regex.exec(i)[1]; // gives IP
                PORT = regex.exec(i)[2]; // gives port
            } else {
                // fall back to the old method if things don't work out.
                const al = i.match(/\d+$|(\[.*\]|\d+\.\d+\.\d+\.\d+)/g);
                IP = al[0];
                PORT = al[1] ? ':' + al[1] : '';
            }

            return {
                ip: i,
                isIPv6: IP.match(/\:/g) && IP.match(/\:/g).length > 1,
                shortIPtext1: this.compIPV6(IP).replace(/\[|\]/g, ''),
                shortIPtext2: this.shortcutIPv6String(IP),
                alias: alias && alias.includes(i) ? i : alias,
                IP,
                arrip: [IP.replace(/\[|\]/g, '')],
                PORT
            };
        });

        let diffTs = 0;
        this.labels = data.calldata.map(i => i.sid).reduce((arr, b) => {
            if (arr.indexOf(b) === -1) {
                arr.push(b);
            }
            return arr;
        }, []).map(i => {
            return {
                color_sid: Functions.getColorByString(i, 100, 40, 1),
                callid: i
            };
        });

        /** maping hosts Combinad aliases OR IPs */
        const positionIPs = sortedArray.map(i => this._isSimplifyPort ? [i.srcIp, i.dstIp] : [i.srcId, i.dstId])
            .join(',').split(',').reduce((obj, b) => {
                if (obj[b] === undefined) {
                    obj[b] = Object.keys(obj).length;
                }
                return obj;
            }, {});

        /** sort hosts */
        this.aliasTitle = Object.keys(positionIPs).reduce((arr, ip) => {
            arr[positionIPs[ip]] = this.aliasTitle.find(i => i.ip === ip || i.shortIPtext1 === ip);
            return arr;
        }, []);
        if (this._isCombineByAlias && this._isSimplifyPort && this.aliasTitle) {
            this.aliasTitle = this.aliasTitle.reduce((arr, b) => {
                if (b) {
                    if (b.arrip === undefined) {
                        b.arrip = [b.ip.replace(/\[|\]/g, '')];
                    }
                    const el = arr.find(k => k.alias === b.alias || k.ip === b.ip);
                    if (el) {
                        el.arrip.push(b.ip.replace(/\[|\]/g, ''));
                    } else {
                        arr.push(b);
                    }
                }
                return arr;
            }, []);
        }
        const getHostPosition = (ip, port, ipId) => {
            const isEqual = (src, ip, port) => {
                if ((ip.match(/[\:]/g) || []).length > 1) {
                    // it's IPv6
                    return src === ip;
                }
                // it's IPv4
                ip = ip.split(':')[0];
                return src === ip || src === `${ip}:${port}`;
            };
            const [isC, isS] = [this._isCombineByAlias, this._isSimplifyPort];
            let num = 0;
            if (isC && isS) { // 1 1
                num = this.aliasTitle.findIndex(i => i.arrip.includes(ip));
            } else
                if (!isC && isS) { // 0 1
                    num = this.aliasTitle.findIndex(i => isEqual(i.IP, ip, port));
                } else
                    if (!isS) { // 1 0
                        num = this.aliasTitle.findIndex(i => (isEqual(i.IP, ip, port) && i.PORT === port + '') || i.ip === ipId);
                    }
            return num;
        };
        const at = this.aliasTitle;
        if (at.length === 2 && at[1].arrip.length) {
            at.push({
                empty: true
            });
        }

        this.flowGridLines = Array.from({ length: at.length - 1 });

        this.arrayItems = sortedArray.map((item, key, arr) => {
            diffTs = key - 1 >= 0 && arr[key - 1] !== null ? (item.micro_ts - arr[key - 1].micro_ts) / 1000 : 0;
            const { min, max, abs } = Math;
            const srcPosition = getHostPosition(item.srcIp, item.srcPort, item.srcId),
                dstPosition = getHostPosition(item.dstIp, item.dstPort, item.dstId),
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
                rightEnd: this.aliasTitle.length - 1 - max(a, b),
                shortdata: '',
                isRedialArrow,
                arrowStyleSolid: item.method_text === 'RTCP' || item.method_text === 'RTP'
            };
            const typeItem = item.method_text === 'RTCP' || item.method_text === 'RTP' ? item.method_text : 'SIP';
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
                micro_ts: moment(item.micro_ts).format('YYYY-MM-DD HH:mm:ss.SSS Z'),
                diffTs: diffTs.toFixed(3),
                proto: Functions.protoCheck(item.protocol),
                typeItem,
                style: {
                    left: position_from / this.aliasTitle.length * 100,
                    width: position_width / this.aliasTitle.length * 100
                }
            };
        });


        this.dataSource = Functions.messageFormatter(this.dataItem.data.messages);
        this.cdr.detectChanges();
    }

    onClickItem(item: any, event = null) {
        if (!item) {
            return;
        }
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
    * @param {object|any} obj object to sort properties
    * @param {string|int} sortedBy 1 - sort object properties by specific value.
    * @param {bool} isNumericSort true - sort object properties as numeric value, false - sort as string value.
    * @param {bool} reverse false - reverse sorting.
    * @returns {Array} array of items in [[key,value],[key,value],...] format.
    */
    private sortProperties(obj: any, sortedBy: any = 1, isNumericSort = false, reverse = false) {
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

        return sortable.reduce((target, [key, value]) => {
            target[key] = value;
            return target;
        }, {});
    }

    identify(index, item) {
        return item.id;
    }
    pipeToString(itemhost) {
        const arr = itemhost.arrip || [itemhost.IP];
        return arr.join(', ');
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
                setTimeout(() => {
                    this.pngReady.emit({});
                }, 100);
            });
        }
    }
    onCopyToClipboard(e) {
        const el = document.createElement('textarea');
        el.value = e;
        el.setAttribute('readonly', '');
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        window.alert('IP ' + e + ' copied to clipboard');
    }
    openSnackBar(e) {
        const el = document.createElement('textarea');
        el.value = e;
        el.setAttribute('readonly', '');
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        const message = e;
        const action = 'copied to clipboard';
        this._snackBar.open(message, action, {
            duration: 3000,
            panelClass: 'copysnack'
        });
    }
    onScroll({ target: { scrollTop } }) {
        if (this.ScrollTarget === 'virtualScrollbar') {
            this.virtualScroll.scrollToOffset(scrollTop);
            return;
        }
        if (this.ScrollTarget === 'virtualScroll') {
            this.virtualScrollbar.nativeElement.scrollTop = scrollTop;
            return;
        }
    }
    get getVirtualScrollHeight(): string {
        const _h = Math.floor((this.virtualScroll && this.virtualScroll.elementRef.nativeElement.scrollHeight || 1) + 80);
        return `translateY(${_h}px)`;
    }
    setScrollTarget(targetString: string) {
        this.ScrollTarget = targetString;
    }
}
