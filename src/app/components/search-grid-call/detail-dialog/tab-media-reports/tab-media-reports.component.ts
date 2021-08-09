import {
    Component,
    OnInit,
    Input,
    EventEmitter,
    Output,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    AfterViewInit
} from '@angular/core';

import { Color } from 'ng2-charts';
import * as moment from 'moment';
import { Functions } from '@app/helpers/functions';
import { TooltipService } from '@services/tooltip.service';
import { ChartsService } from './charts/charts.service';
import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';
import {
    MessageDetailsService,
    ArrowEventState,
} from '@app/services/message-details.service';
@Component({
    selector: 'app-tab-media-reports',
    templateUrl: './tab-media-reports.component.html',
    styleUrls: ['./tab-media-reports.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabMediaReportsComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    originalOrder = Functions.originalOrder;
    clone = Functions.cloneObject;
    @ViewChild('mosMetrics') mosMetrics: ElementRef;

    public metricType = 'mos'; // default mos
    public metricTypes = {
        mos: 'Mean MOS (0-4.5)',
        jitter: 'Mean Jitter (ms)',
        delta: 'Delta (ms)',
        skew: 'Skew (ms)',
        bytes: 'Bytes (b)',
        pl: 'Packet Loss',
        packets: 'Total Packets',
    };

    public style = '';
    public lineChartColors: Color[] = [];
    chartHeight;
    public chartType = 'line';
    public chartLegend = true;
    alias: any;
    legendItems: Array<any>;
    _legendBuffer: Array<any>;

    /** end chart property */

    networkReports = {
        details: [],
        columns: [],
        columnsFilter: ['reporter', 'type', 'callid', 'Src IP', 'Src Port', 'Dest IP', 'Dest Port', 'mos'],
    };
    uaReports = {
        details: [],
        columns: [],
        columnsFilter: ['reporter', 'type', 'callid', 'Src IP', 'Src Port', 'Dest IP', 'Dest Port'],
    };
    callidColor = Functions.getColorByString;
    callTransaction: Array<any> = [];
    rtppos: any = {};
    rtpagentReports: any = {};
    metricOpt = false;
    columns = ['id', 'date', 'time', 'reporter', 'type', 'callid', 'Src IP', 'Src Port', 'Dest IP', 'Dest Port', 'mos'];
    uaReportColumns = ['id', 'date', 'time', 'reporter', 'type', 'callid', 'Src IP', 'Src Port', 'Dest IP', 'Dest Port'];
    callIdList = [];
    _dataItem: any;
    filters: any;
    filterSubscription: Subscription;
    rtpAgentArray: Array<any> = [];
    rtpAgentButtons: Array<any> = [];
    channelIdMessageDetailsForMetricCharts: string;
    channelIdMessageDetailsForUAReports: string;
    channelIdMessageDetailsForNetworkReports: string;

    ___dataItemHASH = '';
    @Input() set dataItem(_dataItem) {
        this._dataItem = _dataItem;

        this.alias = _dataItem.data.alias;
        this.channelIdMessageDetailsForMetricCharts =
            'TabMessages-MetricCharts-' + _dataItem.data.callid.join();
        this.channelIdMessageDetailsForUAReports =
            'TabMessages-UAReports-' + _dataItem.data.callid.join();
        this.channelIdMessageDetailsForNetworkReports =
            'TabMessages-NetworkReports-' + _dataItem.data.callid.join();
        this.initData();
        this.cdr.detectChanges();
    }

    @Output() ready: EventEmitter<any> = new EventEmitter();
    @Output() filterState: EventEmitter<any> = new EventEmitter();


    constructor(
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef,
        public chartsService: ChartsService,
        private messageDetailsService: MessageDetailsService
    ) { }
    ngOnInit() {
        this.filterSubscription = TransactionFilterService.listen.subscribe(filterData => {
            this.filters = filterData;
            this.initData();
            this.cdr.detectChanges();
        });
        this.chartHeight = this.metricOpt ? 240 : 280;
        this.messageDetailsService.arrows.subscribe((data) => {
            if (!data) {
                return;
            }
            const { channelId } = data.metadata.data;
            let { itemId } = data.metadata.data;
            switch (data.eventType) {
                case ArrowEventState.PREVIOUS:
                    itemId--;
                    break;
                case ArrowEventState.FOLLOWING:
                    itemId++;
                    break;
            }

            switch (channelId) {
                case this.channelIdMessageDetailsForMetricCharts:
                    this.onMetricChartsClick(this.rtpAgentArray[itemId], null, {
                        isLeft: !!this.rtpAgentArray[itemId - 1],
                        isRight: !!this.rtpAgentArray[itemId + 1],
                        itemId,
                    });
                    break;
                case this.channelIdMessageDetailsForUAReports:
                    this.onUAReportsClick(this.uaReports.details[itemId], null, {
                        isLeft: !!this.uaReports.details[itemId - 1],
                        isRight: !!this.uaReports.details[itemId + 1],
                        itemId,
                    });
                    break;
                case this.channelIdMessageDetailsForNetworkReports:
                    this.onNetworkReportsClick(this.networkReports.details[itemId], null, {
                        isLeft: !!this.networkReports.details[itemId - 1],
                        isRight: !!this.networkReports.details[itemId + 1],
                        itemId,
                    });
                    break;
            }
        });
    }
    generateLegend(e) {
        const _ = Functions.md5object;
        if (_(this._legendBuffer) !== _(e)) {
            this._legendBuffer = Functions.cloneObject(e);
            e.forEach(item => {
                item.text = this.getAliasByIp(item.text, true);
            });
            this.legendItems = e;
            this.cdr.detectChanges();
        }
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.ready.emit({});
            this.cdr.detectChanges();
        }, 35);
    }
    ngAfterViewChecked() {
    }

    private functionString(item) {
        return `${item.messageType}-${item.srcAlias}-${item.source_port}`;
    }

    initData() {
        const h = Functions.md5object({ f: this.filters, d: this._dataItem });
        if (this.___dataItemHASH === h) {
            return;
        }
        this.___dataItemHASH = h;

        const dt = performance.now();
        const _dataItem = Functions.cloneObject(this._dataItem);
        if (this.filters && _dataItem?.data?.messages) {
            const { CallId, PayloadType } = this.filters;
            const rtpAgentArrayFilteredData = _dataItem.data.messages.filter(({ typeItem, callid }) => {
                const boolPayloadFilter = (PayloadType && PayloadType.find(i => i.title === typeItem)) || { selected: true };
                const boolCallId = CallId && callid &&
                    CallId.filter((j) => j.selected).map(({ title }) => title).includes(callid)
                return boolCallId && boolPayloadFilter.selected;
            });

            this.callIdList = rtpAgentArrayFilteredData.map((i) => i.callid).sort().filter((i, k, a) => i !== a[k - 1]);
            this.rtpAgentArray = rtpAgentArrayFilteredData.filter((i) => i.QOS).map((i) => {
                const { srcAlias, dstAlias } = (i.messageData);
                let { diff } = (i.messageData);
                diff = parseFloat(diff.match(/[-]{0,1}[\d]*[.]{0,1}[\d]+/g)) * 1000000; // to us
                return Object.assign({}, i, i.QOS, { srcAlias, dstAlias, diff });
            });
            this.rtpAgentArray.forEach((i, key) => { i.create_ts = i.create_ts + key; });

            const fs = this.functionString;
            this.rtpAgentButtons = this.rtpAgentArray
                .sort((i, j) => {
                    const a = fs(i), b = fs(j);
                    return a < b ? -1 : a > b ? 1 : 0;
                })
                .filter((i, k, arr) => {
                    if (k === 0) {
                        return true;
                    }
                    const j = arr[k - 1];
                    const a = fs(i),
                        b = fs(j);
                    return a !== b;
                });
            this.rtpAgentArray = this.rtpAgentArray.filter(({ qosTYPE }) => ['PERIODIC', 'HANGUP'].includes(qosTYPE));

            /**
             * if only one time on time axis
             */
            const isOneTime = this.rtpAgentArray
                .map(i => new Date(i.create_ts).toLocaleString())
                .filter((i, k, a) => i !== a[k + 1]).length === 1;

            this.chartType = isOneTime ? 'bar' : 'line';

            const reportData = (tabType) => _dataItem.data.messages.filter((i) => i.QOS && i.QOS.tabType === tabType);

            this.initTabMediaReports(reportData('NetworkReport'));
            this.initTabUaReports(reportData('UAReport'));
            this.cdr.detectChanges();

        }
    }

    isHide(item) {
        const fs = this.functionString;
        this.rtpAgentArray.forEach((i) => fs(i) === fs(item) && (i.off = item.off));
    }


    updateChartType(type) {
        this.chartType = type;
        this.cdr.detectChanges();
    }
    rtpButtonClick(item) {
        if (item.off === null || item.off === undefined) {
            item.off = false;
        }
        item.off = !item.off;

        this.isHide(item);

    }

    showTooltip(item: any) {
        this.tooltipService.show(item);
    }

    hideTooltip() {
        this.tooltipService.hide();
    }

    private initTabMediaReports(data: any) {
        if (data) {
            if (!this.filters) {
                this.networkReports.details = data;
                this.formattedData(this.networkReports.details);
                this.networkReports.columns = this.columns;
            } else {
                let localData = Functions.cloneObject(data);
                const { CallId, PayloadType, filterIP } = this.filters;
                localData = localData.filter(report => PayloadType.find(type => type.title === report.method).selected); // filter by type
                localData = localData.filter(report => CallId.find(callid => callid.title === report.callid).selected); // filter by callid
                this.networkReports.details = localData;
                this.formattedData(localData);
                this.networkReports.columns = this.columns;
            }
        } else {
            this.networkReports.details = [];
        }

        this.cdr.detectChanges();
    }

    private initTabUaReports(data: any) {
        if (data) {
            if (!this.filters) {
                this.uaReports.details = data;
                this.formattedData(this.uaReports.details);
                this.uaReports.columns = this.uaReportColumns;
            } else {
                let localData = Functions.cloneObject(data);

                const { CallId, PayloadType, filterIP } = this.filters;
                localData = localData.filter(report => PayloadType.find(type => type.title === report.method).selected); // filter by type
                localData = localData.filter(report => CallId.find(callid => callid.title === report.callid).selected); // filter by callid
                this.uaReports.details = localData;
                this.formattedData(localData);
                this.uaReports.columns = this.uaReportColumns;
            }
        } else {
            this.uaReports.details = [];
        }
        this.cdr.detectChanges();
    }
    private getAliasByIp(ip, withPort = false) {
        if (!this.alias) {
            return null;
        }
        const alias = this.alias;
        const isIPv4 = ip.match(/^\d+\.\d+\.\d+\.\d+(\:\d+)?$/g) !== null;
        let PORT = isIPv4 ? ip?.match(/\:\d+/g)?.find(j => !!j)?.split(':')[1] * 1 || 0 : 0;
        let IP = isIPv4 ? ip?.match(/^\d+\.\d+\.\d+\.\d+/g)?.find(j => !!j) : ip;
        let IP_PORT = `${IP}:${PORT}`;
        if (!isIPv4) {
            PORT = ip.split(/\:/g).pop() * 1;
            IP = ip.split(/\:\d+$/g).shift().replace(/\[|\]/g, '');
            IP_PORT = `[${IP}]:${PORT}`;
        }
        const ip_al = alias[IP_PORT] || alias[IP + ':0'] || IP;
        return withPort ? `${ip_al}:${PORT}` : ip_al;
    }

    private formattedData(dataItem: any) {
        dataItem.forEach((item) => {
            const t = moment(item.micro_ts);
            item.date = t.format('DD-MM-YYYY');
            item.time = t.format('HH:mm:ss.SSS');
            item.reporter = item.reportname || 'RTPAGENT';
            item.type = item.type || item.typeItem || 'RTP';
            item['Src IP'] = this.getAliasByIp(item.source_ip) || item.source_ip;
            item['Dest IP'] = this.getAliasByIp(item.destination_ip) || item.destination_ip;
            item['Src Port'] = item.source_port;
            item['Dest Port'] = item.destination_port;
            item.mos = (item.QOS && item.QOS.MOS) || '';
        });
        this.cdr.detectChanges();
    }

    showMessage(eventData: any, type = '') {
        const { event, row } = eventData;
        let itemData: any, fIndex;

        switch (type) {
            case 'MetricCharts':
                const indexItemMC = eventData.data.index;
                itemData = this.rtpAgentArray[indexItemMC];
                itemData.indexItem = indexItemMC;
                this.onMetricChartsClick(itemData, event, {
                    isLeft: !!this.rtpAgentArray[indexItemMC - 1],
                    isRight: !!this.rtpAgentArray[indexItemMC + 1],
                    itemId: indexItemMC,
                });
                break;
            case 'NetworkReports':
                const rData = this.networkReports.details;
                fIndex = rData.findIndex(i => i.QOS.uuid === row.QOS.uuid);
                itemData = rData[fIndex];
                this.onNetworkReportsClick(itemData, event, {
                    isLeft: !!rData[fIndex - 1],
                    isRight: !!rData[fIndex + 1],
                    itemId: fIndex,
                });
                break;
            case 'UAReports':
                const uaData = this.uaReports.details;
                fIndex = uaData.findIndex(i => i.QOS.uuid === row.QOS.uuid);
                itemData = uaData[fIndex];
                this.onUAReportsClick(itemData, event, {
                    isLeft: !!uaData[fIndex - 1],
                    isRight: !!uaData[fIndex + 1],
                    itemId: fIndex,
                });
                break;
        }
    }
    private calcId(itemData, row) {
        return `${itemData.id || ''} ` +
            `(${itemData.messageType || 'RTP'}) ` +
            `RTP_SIP_CALL_ID:${row.raw.RTP_SIP_CALL_ID} ` +
            `${moment(itemData.create_ts).format('HH:mm:ss.SSS')} ${itemData.__item__index__}`;
    }
    onMetricChartsClick(
        itemData: any,
        event = null,
        { isLeft = false, isRight = false, itemId = 0 }
    ) {
        const row: any = Functions.cloneObject(itemData);
        row.raw = itemData.message;
        row.id = this.calcId(itemData, row);

        this.messageDetailsService.open(row, {
            isLeft,
            isRight,
            itemId,
            channelId: this.channelIdMessageDetailsForMetricCharts,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this._dataItem.data.callid.join('---')).isBrowserWindow
        });
    }

    onUAReportsClick(
        itemData: any,
        event = null,
        { isLeft = false, isRight = false, itemId = 0 }
    ) {
        const item = itemData.source_data;
        const row: any = Functions.cloneObject(item.QOS);
        row.raw = item.QOS.message;
        row.id = this.calcId(itemData, row);

        this.messageDetailsService.open(row, {
            isLeft,
            isRight,
            itemId,
            channelId: this.channelIdMessageDetailsForUAReports,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this._dataItem.data.callid.join('---')).isBrowserWindow
        });
    }

    onNetworkReportsClick(
        itemData: any,
        event = null,
        { isLeft = false, isRight = false, itemId = 0 }
    ) {
        const item = itemData.source_data;
        const row: any = Functions.cloneObject(item.QOS);
        row.raw = item.QOS.message;
        row.id = this.calcId(itemData, row);

        this.messageDetailsService.open(row, {
            isLeft,
            isRight,
            itemId,
            channelId: this.channelIdMessageDetailsForNetworkReports,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this._dataItem.data.callid.join('---')).isBrowserWindow
        });
    }

    onShowMetricOptions(menu) {
        this.metricOpt = !this.metricOpt ? true : false;

        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        menu.parentNode.style.height = menu.parentNode.style.height === 32 ? 0 : 32;

        this.cdr.detectChanges();
    }

    color(str: string) {
        return Functions.getColorByString(str);
    }

    onRadioButton(event?) {
        setTimeout(() => {
            this.cdr.detectChanges();
        });
    }
    ngOnDestroy() {
        if (this.filterSubscription) {
            this.filterSubscription.unsubscribe();
        }
    }
    setFilterVisibility(visibility) {
        console.log('setFilterVisibility', visibility)
        this.filterState.emit(visibility);
    }
}
