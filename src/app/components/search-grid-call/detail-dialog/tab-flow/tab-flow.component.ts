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
  Output,
} from '@angular/core';
// import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Functions } from '@app/helpers/functions';
import * as html2canvas from 'html2canvas';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { TooltipService } from '@app/services/tooltip.service';
import {
  MessageDetailsService,
  ArrowEventState,
} from '@app/services/message-details.service';
import {
  CdkVirtualScrollViewport,
  FixedSizeVirtualScrollStrategy,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import { AfterViewChecked, OnDestroy, HostListener } from '@angular/core';
import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { Subscription } from 'rxjs';
import { CallIDColor } from '@app/models/CallIDColor.model';
import { CopyService } from '@app/services';
import { FlowFilter } from '@app/components/controls/transaction-filter/transaction-filter.component';

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
  providers: [
    { provide: VIRTUAL_SCROLL_STRATEGY, useClass: CustomVirtualScrollStrategy },
  ],
})
export class TabFlowComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('flowscreen', { static: true }) flowscreen: ElementRef;
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  @ViewChild('downloadLink', { static: true }) downloadLink: ElementRef;
  @ViewChild('virtualScroll') virtualScroll: any;
  @ViewChild('virtualScrollbar') virtualScrollbar: ElementRef;
  @ViewChild('VScrollWrapper') VScrollWrapper: ElementRef;
  @ViewChild('labelContainer') labelContainer: ElementRef;
  @Input() callIDColorList: Array<CallIDColor>;
  /**
    *  Detect Safari browser
    */
  isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);


  _interval = null;
  public getVirtualScrollHeight: string = `translateY(1px)`;
  public isSimplifyPort = false;
  _isCombineByAlias = false;
  private _dataItem: any;
  private filters: FlowFilter;
  private ScrollTarget: string;
  flowGridLines = [];
  isExport = false;
  hosts: Array<any>;
  hostsCA: Array<any>;
  hostsIPs: Array<any>;
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
  hidden: boolean = true;
  callidPullerPosition: number = 0;

  copyTimer: number;
  selected: boolean;
  timeout;
  @Input() callid: any;

  outEventDelayOff = 0;

  get outEventOff() {
    //
    return this.outEventDelayOff + 1000 < performance.now();
  }
  @Input() set isSimplify(v: boolean) {
    this._isSimplify = v;
    try {
      this.virtualScroll._contentWrapper;
    } catch (e) { }
    requestAnimationFrame(() => this.cdr.detectChanges());
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

    const aliases = this.ipaliases.filter((alias) => alias.status === true);
    this.hosts.forEach((host) => {
      const aliasCollection = aliases.filter(
        ({ ip, port }) => ip === host.ip && (port === host.port || port === 0)
      );
      const aliasItem =
        aliasCollection.find(({ port }) => port === host.port) ||
        aliasCollection.find(({ port }) => port === 0);

      if (aliasItem) {
        /** add here the filtered params for display in flow tooltip*/
        const filtered = ['status', 'port'];

        const selected = Object.keys(aliasItem)
          .filter((key) => !filtered.includes(key))
          .reduce((obj, key) => {
            obj[key] = aliasItem[key];
            return obj;
          }, {});

        Object.assign(host, selected);
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
    private messageDetailsService: MessageDetailsService,
    private copyService: CopyService,
    private transactionFilterService: TransactionFilterService
  ) { }

  ngOnInit() {
    this.getVirtualScrollHeight = `translateY(1px)`;
    this.filterSubscription = this.transactionFilterService.listen.subscribe(
      (filters) => {
        this.setFilters(filters);
      }
    );
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
    this.outEvent();
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
      this.labels = CallId.map(({ title, selected }) => {
        const color = this.callIDColorList?.find(
          (callID) => callID.callID === title
        );
        return {
          callid: title,
          color:
            typeof color !== 'undefined'
              ? color.backgroundColor
              : Functions.getColorByString(title),
          selected: selected,
          copySelected: false,
          currentlySelected: false,
        };
      });
    }
    this.arrayItems = Functions.cloneObject(this.dataItem.data.messages).filter(
      (item: any) => {
        const source_ip = filterIP?.find((i) => i.title === item.source_ip) || {
          selected: true,
        };
        const destination_ip = filterIP?.find(
          (i) => i.title === item.destination_ip
        ) || { selected: true };
        const bool = source_ip.selected || destination_ip.selected;
        return bool;
      }
    );

    this.arrayItems.forEach((item) => {
      const itemFilter = CallId?.find((i) => i.title === item.callid) || {
        selected: true,
      };
      const payloadFilter = PayloadType?.find(
        (i) => i.title === item.typeItem
      ) || { selected: true };
      const bool = !(itemFilter.selected && payloadFilter.selected);
      if (bool !== item.invisible) {
        item.invisibleDisplayNone = false;
        item.invisible = bool;
      }
    });

    const _arrayItems: any = this.arrayItems.filter((i) => !i.invisible);
    this.hostsIPs = this.getHostsByMessage(
      _arrayItems,
      isCombineByAlias,
      isSimplifyPort
    );

    this.updateHosts();

    const { min, max, abs } = Math;
    const shownHosts: any = isCombineByAlias ? this.hostsCA : this.hostsIPs;
    this.flowGridLines = Array.from({ length: shownHosts.length - 1 });

    const [lastHost] = shownHosts.slice(-1);

    _arrayItems.forEach((item) => {
      const { srcAlias, dstAlias } = item || item?.messageData?.item || {};
      const srcPosition = this.getHostPosition(
        item.source_ip,
        item.source_port,
        srcAlias || item.source_ip
      );
      const dstPosition = this.getHostPosition(
        item.destination_ip,
        item.destination_port,
        dstAlias || item.destination_ip
      );
      const isRadialArrow = srcPosition === dstPosition;
      const isLastHost =
        isRadialArrow &&
        shownHosts.length > 1 &&
        lastHost.ip === item.source_ip;

      const a = srcPosition;
      const b = dstPosition;
      const mosColor = item.QOS
        ? 'blinkLamp ' + this.mosColorBlink(item.QOS.MOS)
        : '';

      const color = this.callIDColorList?.find(
        (callID) => callID.callID === item.callid
      );
      const compiledColor = `hsla(${color?.decompiledColor?.hue}, ${color?.decompiledColor?.saturation
        }%, ${color?.decompiledColor?.lightness - 10}%, 1)`;
      item.options = {
        mosColor,
        color:
          typeof color !== 'undefined'
            ? compiledColor
            : Functions.getColorByString(item.callid, 60, 60),
        color_method: Functions.getMethodColor(item.method + ''),
        start: min(a, b),
        middle: abs(a - b) || 1,
        direction: isLastHost || a > b,
        rightEnd: shownHosts.length - 1 - max(a, b),
        shortdata: '',
        isRadialArrow,
        isLastHost,
        arrowStyleSolid: item.typeItem === FlowItemType.SIP,
      };
    });

    this.arrayItems = _arrayItems;
    this.arrayItems.forEach((item) => {
      item.invisibleDisplayNone = item.invisible;
    });
    this.arrayItemsVisible = this.arrayItems.filter(
      (i) => !i.invisibleDisplayNone
    );
    this.setVirtualScrollItemsArray();
    setTimeout(() => this.cdr.detectChanges(), 10);
  }
  setVirtualScrollItemsArray() {
    this.virtualScrollerItemsArray = [
      { _step: 'top' },
      ...this.arrayItemsVisible,
      { _step: 'bottom' },
    ];
  }
  getHostsByMessage(arrayItems: Array<any>, isCombineByAlias, isSimplifyPort) {
    const hosts = Functions.cloneObject(this.hosts);

    const collectH = arrayItems.map((i) => {
      const source_ipisIPv6 = i.source_ip.match(/\:/g)?.length > 1;
      const destination_ipisIPv6 = i.destination_ip.match(/\:/g)?.length > 1;
      const sIP = source_ipisIPv6 ? `[${i.source_ip}]` : i.source_ip;
      const dIP = destination_ipisIPv6
        ? `[${i.destination_ip}]`
        : i.destination_ip;
      const { srcAlias, dstAlias } = i.source_data || {};
      return isCombineByAlias
        ? [srcAlias || i.source_ip, dstAlias || i.destination_ip]
        : isSimplifyPort
          ? [i.source_ip, i.destination_ip]
          : [`${sIP}:${i.source_port}`, `${dIP}:${i.destination_port}`];
    });

    // sort hosts by Items timeline
    const sortHosts = [];
    for (let i = 0; i < collectH.length; i++) {
      const [src, dst] = collectH[i];
      // src
      if (!sortHosts.includes(src)) {
        sortHosts.push(src);
      }
      // dist
      if (!sortHosts.includes(dst)) {
        sortHosts.push(dst);
      }
    }

    const selected_hosts = sortHosts.map((i) =>
      hosts.find((j) => [j.ip, j.host, j.alias].includes(i))
    );
    return selected_hosts.filter((host) => !!host);
  }
  toggleLegend() {
    this.hidden = !this.hidden;
    this.callidPullerPosition = this.labelContainer.nativeElement.offsetHeight;
  }
  updateHosts() {
    const aggregatedHosts = Functions.cloneObject(this.hostsIPs);
    aggregatedHosts.forEach((i) => {
      this.hosts
        .filter((h) => h?.alias === i?.alias)
        .forEach((item: any) => {
          i.ip_array = i.ip_array || [];
          if (i.ip_array.find(({ ip }) => ip === item.ip)) {
            return;
          }
          i.ip_array.push({
            ip: item.ip,
            host: item,
          });
        });
    });
    aggregatedHosts.forEach((i) => {
      if (i?.ip_array?.length) {
        for (let n = 1; n < i.ip_array.length; n++) {
          const h = aggregatedHosts.find((j) => i.ip_array[n]?.ip === j.ip);
          if (h) {
            h.invisible = true;
          }
        }
      }
    });
    this.hostsCA = aggregatedHosts.filter((h) => !!h && !h.invisible);
  }
  getHostPosition(ip, port, alias) {
    ip = ip.replace(/\[|\]/g, '');
    const hosts = this._isCombineByAlias ? this.hostsCA : this.hostsIPs;
    return hosts
      .filter((i) => !!i)
      ?.findIndex((host) => {
        try {
          return this._isCombineByAlias
            ? host.alias && alias
              ? host.alias === alias
              : host.ip === ip
            : this.isSimplifyPort
              ? host.ip === ip
              : host.ip === ip && (host.port * 1 === port * 1 || !port);
        } catch (err) {
          throw host;
        }
      });
  }
  updateDOMScroller() {
    /**
     * hack for scroll DOM update
     */
    const _vs = this.virtualScrollbar?.nativeElement;
    _vs.style.bottom = '1px';
    setTimeout(() => {
      _vs.style.bottom = '0px';
      this.setVirtualScrollHeight();
      setTimeout(() => {
        this.updateDOMScroller();
      }, 2000);
    }, 300);
  }
  ngAfterViewInit() {
    requestAnimationFrame(() => {
      this.ready.emit({});
      this.updateDOMScroller();
    });
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
    const index = arrData.findIndex(
      ({ __item__index__ }) => __item__index__ === sitem.__item__index__
    );
    const data: any = arrData[index];
    this.onClickMessageRow(
      data,
      {
        clientX: event && event.pageX,
        clientY: event && event.pageY,
      },
      {
        isLeft: !!arrData[index - 1],
        isRight: !!arrData[index + 1],
        itemId: index,
      }
    );
  }
  onClickMessageRow(
    item: any,
    event = null,
    { isLeft = false, isRight = false, itemId = 0 }
  ) {
    if (!item) {
      return;
    }
    let row: any, SDPbuffer;
    console.log(item.typeItem);
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
        SDPbuffer = JSON.stringify(item.source_data);
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
      case 'HEP-LOG':
        SDPbuffer = JSON.stringify(item.source_data);
        row = item.source_data;
        row.raw = item.source_data?.item?.message || [
          item.info_date,
          item.description,
          Object.assign({}, item.source_data),
        ];
        if (!row.raw_source) {
          row.raw_source =
            item.source_data?.item?.message ||
            `${item.info_date} ${item.description} ${SDPbuffer}`;
        }
        row.id = `(${item.typeItem}) ${item.description}`;

        break;
    }
    row.id =
      row?.id || `(${item.typeItem}) ${item.info_date} ${item.description}`;
    row.mouseEventData = event;
    this.messageDetailsService.open(row, {
      isLeft,
      isRight,
      itemId,
      channelId: this.channelIdMessageDetails,
      isBrowserWindow: !!this.messageDetailsService.getParentWindowData(
        this._dataItem.data.callid.join('---')
      ).isBrowserWindow,
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
  labelColor(callid, selected) {
    if (selected) {
      const color = this.callIDColorList?.find(
        (callID) => callID.callID === callid
      );
      const adjustedColor = `hsl(${color?.decompiledColor?.hue}, ${color?.decompiledColor?.saturation
        }%, ${color?.decompiledColor?.lightness / 1.5}%, 1`;
      return typeof color !== 'undefined'
        ? adjustedColor
        : Functions.getColorByString(callid, undefined, 50, 1);
    } else {
      return 'hsla(0, 0%, 30%, 0.5)';
    }
  }
  onClickLabel(_?) {
    return;
  }
  startCopy() {
    this.copyTimer = Date.now();
  }
  copy(value) {
    const localTimer = Date.now();
    if (localTimer - this.copyTimer > 700) {
      this.copyService.copy(value.callid, {
        message: 'notifications.success.callidCopy',
        isTranslation: true,
        translationParams: {
          callid: value.callid,
        },
      });
      value.copySelected = true;
      this.timeout = setTimeout(() => {
        value.copySelected = false;
      }, 1800);
    }
  }
  setScrollTarget(targetString: string) {
    this.ScrollTarget = targetString;
  }
  onScrollVScrollWrapper(event?: any) {
    try {
      const { scrollLeft } = event?.target || {};
      this.flowscreen.nativeElement.style.marginLeft = `${-scrollLeft}px`;
    } catch (e) { }
  }

  cdkWheelScroll(event?: any) {
    if (!event.shiftKey && Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
      event.preventDefault();
    }
  }

  @HostListener('mousemove', ['$event'])
  middleclickEvent(event) {
    if (event.which === 2) {
      event.preventDefault();
      this.setVirtualScrollHeight();
    }
  }

  @HostListener('wheel', ['$event'])
  onWheelScrollWrapper(event?) {
    if (event?.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }
    const scrollbar = this.virtualScrollbar?.nativeElement;
    let movingAverageArray = [];
    const ma = (p) => {
      const valMA = 6;
      if (movingAverageArray.length < valMA) {
        movingAverageArray = Array.from({ length: valMA }, (x) => p);
      }
      movingAverageArray.push(p);
      movingAverageArray = movingAverageArray.slice(-valMA);
      return movingAverageArray.reduce((a, b) => a + b, 0) / valMA;
    };
    ma(scrollbar?.scrollTop);
    const positionTarget = scrollbar?.scrollTop - event.wheelDelta;
    const sUpdate = () => {
      const t =
        event?.animation === false ? positionTarget : ma(positionTarget);
      scrollbar?.scrollTo({
        top: t,
      });
      this.setVirtualScrollHeight();
      if (t !== positionTarget) {
        requestAnimationFrame(sUpdate);
      }
    };
    sUpdate();
  }
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    switch (event.code) {
      case 'PageDown':
        event.preventDefault();
        event.stopPropagation();
        this.onWheelScrollWrapper({ wheelDelta: -500 });
        break;
      case 'PageUp':
        event.preventDefault();
        event.stopPropagation();
        this.onWheelScrollWrapper({ wheelDelta: 500 });
        break;
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.onWheelScrollWrapper({ wheelDelta: -150 });
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.onWheelScrollWrapper({ wheelDelta: 150 });
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.setVirtualScrollHeight({ position: 'start' });
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.setVirtualScrollHeight({ position: 'end' });
        break;
    }
  }
  outEvent() {
    if (this.outEventOff) {
      const container = this.virtualScroll?.elementRef.nativeElement;
      if (!container) {
        return;
      }
      const scrollbar = this.virtualScrollbar?.nativeElement;
      scrollbar?.scrollTo({ top: container.scrollTop });
    }
    this.cdr.detectChanges();
  }
  setVirtualScrollHeight(e?) {
    this.outEventDelayOff = performance.now();
    const container = this.virtualScroll?.elementRef.nativeElement;
    if (!container) {
      this.getVirtualScrollHeight = `translateY(1px)`;
      this.cdr.detectChanges();
      return;
    }
    const scrollbar = this.virtualScrollbar?.nativeElement;
    const { scrollHeight } = container;
    switch (e?.position) {
      case 'start':
        scrollbar.scrollTo({ top: 0 });
        break;

      case 'end':
        scrollbar.scrollTo({ top: scrollHeight + 500 });
        this.onWheelScrollWrapper({ wheelDelta: -500 });
        break;
    }
    this.virtualScroll.scrollTo({ top: scrollbar.scrollTop });
    const _h = Math.floor(scrollHeight);
    this.getVirtualScrollHeight = `translateY(${_h}px)`;
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    this.hideTooltip();
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }
  __toucheStartY = 0;
  __toucheStartX = 0;
  public onEvent(event?: any, type?) {
    const { x: currentX, y: currentY } = Object.values(event?.touches || {})
      ?.map((i: any) => [i?.clientX, i?.clientY])
      .reduce(
        (a, [x, y], k, arr) => {
          a.x += x / arr.length;
          a.y += y / arr.length;
          return a;
        },
        { x: 0, y: 0 }
      );

    if (type === 'touchmove') {
      event.preventDefault();
      event.stopPropagation();

      this.onWheelScrollWrapper({
        wheelDelta: currentY - this.__toucheStartY,
        animation: false,
      });
      const vsw = this.VScrollWrapper.nativeElement;
      vsw.scrollTo({ left: vsw.scrollLeft - (currentX - this.__toucheStartX) });
    }
    this.__toucheStartY = currentY;
    this.__toucheStartX = currentX;
  }
}
