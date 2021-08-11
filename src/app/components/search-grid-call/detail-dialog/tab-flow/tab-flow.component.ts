import {
    Component,
    Input,
    OnInit,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    AfterViewInit,
    EventEmitter,
    ViewEncapsulation,
    Output
} from '@angular/core';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Functions } from '@app/helpers/functions';
import * as html2canvas from 'html2canvas';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { TooltipService } from '@app/services/tooltip.service';
import {
    MessageDetailsService,
    ArrowEventState,
} from '@app/services/message-details.service';
import { FixedSizeVirtualScrollStrategy, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { AfterViewChecked, OnDestroy } from '@angular/core';
import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { Subscription } from 'rxjs';

export class CustomVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
    constructor() {
        super(50, 250, 500);
    }
}


@Component({
    selector: 'app-tab-flow',
    templateUrl: './tab-flow.component.html',
    styleUrls: ['./tab-flow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: VIRTUAL_SCROLL_STRATEGY, useClass: CustomVirtualScrollStrategy }]
})
export class TabFlowComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    @ViewChild('flowscreen', { static: true }) flowscreen: ElementRef;
    @ViewChild('canvas', { static: true }) canvas: ElementRef;
    @ViewChild('downloadLink', { static: true }) downloadLink: ElementRef;
    @ViewChild('virtualScroll') virtualScroll: VirtualScrollerComponent;
    @ViewChild('virtualScrollbar') virtualScrollbar: ElementRef;

    public isSimplifyPort = false;
    _isCombineByAlias = false;
    private _dataItem: any;
    private filters: any;
    private ScrollTarget: string;
    flowGridLines = [];
    isExport = false;
    hosts: Array<any>;
    hostsCA: Array<any>;
    ipaliases: Array<any> = [];
    arrayItems: Array<any> = [];
    arrayItemsVisible: Array<any> = [];
    color_sid: string;
    labels: Array<any> = [];
    _flagAfterViewInit = false;
    channelIdMessageDetails: string;
    hashDataItem = '';
    hashArrayItems = '';
    hashFilters = '';
    filterSubscription: Subscription;
    virtualScrollerItemsArray: Array<any> = [];
    _isSimplify: boolean;


    @Input() callid: any;

    @Input() set isSimplify(v: boolean) {
        this._isSimplify = v;
        this.virtualScroll?.refresh();
        setTimeout(() => this.cdr.detectChanges());
    }
    get isSimplify(): boolean {
        return this._isSimplify;
    }


    @Input() set dataItem(dataItem) {
        const _hash = Functions.md5(JSON.stringify(dataItem));
        if (this.hashDataItem === _hash) {
            return;
        } else {
            this.hashDataItem = _hash;
        }
        this._dataItem = dataItem;

        this.color_sid = Functions.getColorByString(this.callid);
        this.hosts = Functions.cloneObject(dataItem.data.hosts);
        this.ipaliases = Functions.cloneObject(dataItem.data.data.ipaliases) || [];
        this.channelIdMessageDetails = 'TabFlow-' + dataItem.data.callid.join();

        const aliases = this.ipaliases.filter(alias => alias.status === true);
        this.hosts.forEach(host => {
            const aliasCollection = aliases.filter(({ ip }) => ip === host.ip);
            const alias =
                aliasCollection.find(({ port }) => port === host.port) ||
                aliasCollection.find(({ port }) => port === 0);

            if (alias) {
                const selection = {
                    alias: alias.alias,
                    color: alias.color,
                    image: alias.image,
                    group: alias.group,
                    ipv6: alias.ipv6,
                    mask: alias.mask,
                    servertype: alias.servertype,
                    shardid: alias.shardid,
                    type: alias.type,
                    isLinkImg: alias.isLinkImg
                };
                Object.assign(host, selection);
            }
        });

        this.setFilters(this.filters);
    }
    get dataItem() {
        return this._dataItem;
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

    @Output() pngReady: EventEmitter<any> = new EventEmitter();
    @Output() ready: EventEmitter<any> = new EventEmitter();

    constructor(
        private cdr: ChangeDetectorRef,
        private tooltipService: TooltipService,
        private messageDetailsService: MessageDetailsService
    ) { }

    ngOnInit() {
        this.filterSubscription = TransactionFilterService.listen.subscribe(this.setFilters.bind(this));
        this.messageDetailsService.arrows.subscribe((data) => {
            const { channelId } = data.metadata.data;
            let { itemId } = data.metadata.data;
            if (data && this.channelIdMessageDetails === channelId) {
                const arrData: Array<any> = this.arrayItemsVisible as Array<any>;
                switch (data.eventType) {
                    case ArrowEventState.PREVIOUS:
                        itemId--;
                        break;
                    case ArrowEventState.FOLLOWING:
                        itemId++;
                        break;
                }
                const itemData: any = this.arrayItemsVisible[itemId];
                this.onClickMessageRow(arrData[itemId], data.metadata.mouseEventData, {
                    isLeft: !!arrData[itemId - 1],
                    isRight: !!arrData[itemId + 1],
                    itemId,
                });
            }
        });
        this.cdr.detectChanges();
    }

    private setFilters(filters) {
        if (!filters || !this.hosts) {
            return;
        }
        this.filters = filters;
        const {
            CallId,
            PayloadType,
            filterIP,
            isSimplify,
            isSimplifyPort,
            isCombineByAlias,
        } = filters;

        this._isCombineByAlias = isCombineByAlias;
        this.isSimplify = !isSimplify;
        this.isSimplifyPort = isSimplifyPort;
        if (CallId) {
            this.labels = CallId.filter(({ selected }) => selected).map(
                ({ title }) => ({
                    callid: title,
                    color: Functions.getColorByString(title),
                })
            );
        }
        this.arrayItems = Functions.cloneObject(this.dataItem.data.messages)
            .filter(item => {
                const source_ip = (filterIP?.find(i => i.title === item.source_ip)) || { selected: true };
                const destination_ip = (filterIP?.find(i => i.title === item.destination_ip)) || { selected: true };
                const bool = (source_ip.selected && destination_ip.selected);
                return bool;
            });

        this.arrayItems.forEach((item) => {
            const itemFilter = (CallId && CallId.find(i => i.title === item.callid)) || { selected: true };
            const payloadFilter = (PayloadType && PayloadType.find(i => i.title === item.typeItem)) || { selected: true };
            const bool = !(itemFilter.selected && payloadFilter.selected);
            if (bool !== item.invisible) {
                item.invisibleDisplayNone = false;
                item.invisible = bool;
            }
        });

        const visibleHosts = this.arrayItems
            .filter((i) => !i.invisible)
            .map((i) => {
                const source_ipisIPv6 = i.source_ip.match(/\:/g)?.length > 1;
                const destination_ipisIPv6 = i.destination_ip.match(/\:/g)?.length > 1;
                const sIP = source_ipisIPv6 ? `[${i.source_ip}]` : i.source_ip;
                const dIP = destination_ipisIPv6 ? `[${i.destination_ip}]` : i.destination_ip;

                return isSimplifyPort
                    ? [i.source_ip, i.destination_ip]
                    : [
                        `${sIP}:${i.source_port}`,
                        `${dIP}:${i.destination_port}`,
                    ];
            })
            .join(',')
            .split(',')
            .sort()
            .filter((i, k, a) => a[k - 1] !== i);

        this.hosts.forEach((h, k, arr) => {

            const name = isSimplifyPort ? h.ip : h.host;
            h.hidden = !visibleHosts.includes(name);

            if (visibleHosts.includes(name)) {
                visibleHosts.splice(visibleHosts.indexOf(name), 1);
            }
            h.arrip = name;


        });
        if (isCombineByAlias) {
            const uniqueAliasArray = Functions.arrayUniques(
                this.hosts.filter((i) => !i.hidden).map(i => i.alias)
            );
            uniqueAliasArray.forEach(alias => {
                this.hosts.filter((i) => i.alias === alias).forEach((i, k) => i.hidden = k !== 0);
            });
        }

        /** mapping hosts Combined aliases OR IPs */
        const objectMap = this.hosts
            .filter((i) => !i.hidden)
            .map((i) => i.arrip || i.alias)
            .reduce((a, b) => {
                if (!a[b]) {
                    a[b] = 0;
                }
                return a;
            }, {});

        /** mapping hosts position by flow */
        let inc = 1;
        this.arrayItems
            .filter((i) => !i.invisible)
            .map((i) => {
                const source_ipisIPv6 = i.source_ip.match(/\:/g)?.length > 1;
                const destination_ipisIPv6 = i.destination_ip.match(/\:/g)?.length > 1;
                const sIP = source_ipisIPv6 ? `[${i.source_ip}]` : i.source_ip;
                const dIP = destination_ipisIPv6 ? `[${i.destination_ip}]` : i.destination_ip;

                return isSimplifyPort
                    ? [i.source_ip, i.destination_ip]
                    : [
                        `${sIP}:${i.source_port}`,
                        `${dIP}:${i.destination_port}`,
                    ];
            })
            .join(',')
            .split(',')
            .forEach((i) => {
                Object.keys(objectMap).forEach((j) => {
                    const bool = j.includes('\n') ? j.split('\n').includes(i) : j === i;
                    if (bool && objectMap[j] === 0) {
                        objectMap[j] = inc;
                        inc++;
                    }
                });
            });

        /** sort hosts */
        const indexHost = this.hosts.filter((i) => !i.hidden).length - 1;
        for (let index = indexHost; index > 0; index--) {
            const [ip] = Object.entries(objectMap)
                .filter((i) => i[1] === index)
                .map((i) => i[0]);
            const _ind = this.hosts.findIndex((i) =>
                i.arrip ? i.arrip.includes(ip) : ip === i.alias
            );
            this.hosts.unshift(this.hosts.splice(_ind, 1)[0]);
        }

        this.flowGridLines = Array.from({
            length: this.hosts.filter((i) => !i.hidden).length - 1,
        });

        const { min, max, abs } = Math;
        const _arrayItems: any = this.arrayItems;
        const shownHosts: any = this.hosts.filter(i => !i.hidden);
        const [lastHost] = shownHosts.slice(-1);
        _arrayItems
            .filter((i) => !i.invisible)
            .forEach((item) => {
                const { srcAlias, dstAlias } = item || item?.messageData?.item || {};
                const srcPosition = this.getHostPosition(item.source_ip, item.source_port, srcAlias || item.source_ip);
                const dstPosition = this.getHostPosition(item.destination_ip, item.destination_port, dstAlias || item.destination_ip);

                const isRadialArrow = srcPosition === dstPosition;
                const isLastHost = isRadialArrow &&
                    shownHosts.length > 1 &&
                    lastHost.ip === item.source_ip;

                const a = srcPosition;
                const b = dstPosition;
                const mosColor = item.QOS
                    ? 'blinkLamp ' + this.mosColorBlink(item.QOS.MOS)
                    : '';
                item.options = {
                    mosColor,
                    color: Functions.getColorByString(item.callid),
                    color_method: Functions.getMethodColor(item.method + ''),
                    start: min(a, b),
                    middle: abs(a - b) || 1,
                    direction: isLastHost || a > b,
                    rightEnd: this.hosts.filter((i) => !i.hidden).length - 1 - max(a, b),
                    shortdata: '',
                    isRadialArrow,
                    isLastHost,
                    arrowStyleSolid: item.typeItem === FlowItemType.SIP,
                };
            });

        setTimeout(() => {
            this.cdr.detectChanges();
        }, 35);

        const _hash = Functions.md5object(_arrayItems);
        if (this.hashArrayItems === _hash) {
            return;
        } else {
            this.hashArrayItems = _hash;
            this.arrayItems = _arrayItems;
            this.arrayItems.forEach((item) => {
                item.invisibleDisplayNone = item.invisible;
            });
            this.arrayItemsVisible = this.arrayItems.filter(i => !i.invisibleDisplayNone);
            this.setVirtualScrollerItemsArray();
        }
        this.updateHosts();
        this.cdr.detectChanges();
    }
    updateHosts() {
        const aggregatedHosts = Functions.cloneObject(this.hosts.filter(i => !i.hidden));
        aggregatedHosts.forEach(i => {
            this.hosts.filter(h => h.alias && h.alias === i.alias).forEach(item => {
                i.ip_array = i.ip_array || [];
                if (i.ip_array.find(({ ip }) => ip === item.ip)) {
                    return;
                }
                i.ip_array.push({
                    ip: item.ip,
                    host: item
                });
            });
        });

        this.hostsCA = aggregatedHosts;
    }
    getHostPosition(ip, port, alias) {
        ip = ip.replace(/\[|\]/g, '');
        return this.hosts.filter(i => !i.hidden).findIndex(host =>
            this._isCombineByAlias ?
                host.alias === alias || host.ip === ip :
                (this.isSimplifyPort ?
                    host.ip === ip :
                    host.ip === ip && host.port * 1 === port * 1)
        );

    }

    ngAfterViewInit() {

        setTimeout(() => {
            this.ready.emit({});
        }, 35);
    }
    ngAfterViewChecked() {
        this._flagAfterViewInit = true;
        setTimeout(() => {
            this.cdr.detectChanges();
        });
    }

    private mosColorBlink(mosNum: number) {
        return (
            (mosNum >= 1 && mosNum <= 2 && 'red') ||
            (mosNum === 3 && 'gray') ||
            (mosNum <= 3 && 'orange') ||
            (mosNum > 3 && 'green')
        );
    }

    showTooltip(hostItem: any) {
        this.tooltipService.show(hostItem);
    }
    hideTooltip() {
        this.tooltipService.hide();
    }
    shortcutIPv6String(str = '') {
        const regexp = /^\[?([\da-fA-F]+)\:.*\:([\da-fA-F]+)\]?$/g;
        const regfn = (fullstring, start, end) => `${start}:...:${end}`;
        return str.replace(regexp, regfn);
    }

    onClickMessage(id: any, event = null, sitem = null) {
        const arrData: Array<any> = this.arrayItemsVisible as Array<any>;
        const index = arrData.findIndex(({ __item__index__ }) => __item__index__ === sitem.__item__index__);
        const data: any = arrData[index];
        this.onClickMessageRow(data, {
            clientX: event && event.pageX,
            clientY: event && event.pageY,
        }, {
            isLeft: !!arrData[index - 1],
            isRight: !!arrData[index + 1],
            itemId: index,
        });
    }
    onClickMessageRow(
        item: any,
        event = null,
        { isLeft = false, isRight = false, itemId = 0 }
    ) {
        if (!item) {
            return;
        }
        let row: any;
        switch (item.typeItem) {
            case FlowItemType.SIP:
                row = item.messageData;
                break;
            case FlowItemType.RTP:
            case FlowItemType.RTCP:
                row = item.QOS;
                row.raw = item.QOS.message;
                row.raw_source = JSON.stringify(item.QOS.message);
                break;
            case FlowItemType.SDP:

                const SDPbuffer = JSON.stringify(item.source_data);
                row = item.source_data;
                row.raw = [
                    item.info_date,
                    item.description,
                    Object.assign({}, item.source_data),
                ];
                row.raw_source = `${item.info_date} ${item.description} ${SDPbuffer}`;
                break;
            case FlowItemType.DTMF:
                const DTMFbuffer = JSON.stringify(item.source_data.DTMFitem);
                row = item.source_data;
                row.raw = [
                    item.info_date,
                    item.description,
                    Object.assign({}, item.source_data.DTMFitem),
                ];
                row.raw_source = `${item.info_date} ${item.description} ${DTMFbuffer}`;
                break;
            case FlowItemType.LOG:
                // console.log('LOG TEST')
                row = item.source_data;
                row.raw = item.source_data?.item?.message;
                row.raw_source = item.source_data?.item?.message;
                row.id = `(${item.typeItem}) ${item.description}`;
                // console.log(row)
                break;

        }
        row.id = row.id || `(${item.typeItem}) ${item.info_date} ${item.description}`;
        row.mouseEventData = event;
        this.messageDetailsService.open(row, {
            isLeft,
            isRight,
            itemId,
            channelId: this.channelIdMessageDetails,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this._dataItem.data.callid.join('---')).isBrowserWindow
        });
    }
    identifyHosts(index, item) {
        return `${index}_${item.host}_${item.hidden}`;
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
            this.cdr.detectChanges();
            const f: Function = html2canvas as Function;
            f(this.flowscreen.nativeElement).then((canvas) => {
                this.canvas.nativeElement.src = canvas.toDataURL();
                this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
                this.downloadLink.nativeElement.download = `${this.callid}.png`;
                this.downloadLink.nativeElement.click();
                setTimeout(() => {
                    this.pngReady.emit({});
                });
            });
        }
    }

    setScrollTarget(targetString: string) {
        this.ScrollTarget = targetString;
    }
    onScrollVScrollWrapper({ target: { scrollLeft } }: any) {
        try {
            this.flowscreen.nativeElement.style.marginLeft = `${-scrollLeft}px`;
        } catch (e) { }

    }
    setVirtualScrollerItemsArray() {
        this.virtualScrollerItemsArray = [{ _step: 'top' }, ...this.arrayItemsVisible, { _step: 'bottom' }];
    }
    ngOnDestroy() {
        this.filterSubscription?.unsubscribe();
    }
}
