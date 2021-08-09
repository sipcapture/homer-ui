import { Functions } from '@app/helpers/functions';
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TooltipService } from '@app/services/tooltip.service';
import * as moment from 'moment';
import { ChartsService } from '../charts.service';

interface DataItem {
    from: number;
    to: number;
    index?: number;
    fromPrecent?: number;
    toPrecent?: number;
    mosColor?: string;
    tooltipData: any;
    messageType?: string;
}
interface DataTemplateItem {
    labelSrc: string;
    srcTip?: string;
    labelDist: string;
    dstTip?: string;
    ipLabel: string;
    data: Array<DataItem>;
}

@Component({
    selector: 'app-chart-horizontal-bar',
    templateUrl: './chart-horizontal-bar.component.html',
    styleUrls: ['./chart-horizontal-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartHorizontalBarComponent implements OnInit {
    _source: Array<any> = [];
    _buffer: any;
    dataTemplate: Array<DataTemplateItem> = [];
    dataByStreams: any = [];
    arrayLocaleString: Array<any> = [];
    legendItems: Array<any>;
    isLegend = false;

    @Input() set source(val: Array<any>) {
        if (this._buffer === JSON.stringify(val)) {
            return;
        }
        if (val && val.length === 0) {
            return;
        }
        this._buffer = JSON.stringify(val);
        this._source = Functions.cloneObject(val || []).map((i, k) => (i.___index___ = k, i));
        this.formattingDataArray();
        this.dataByStreams = this.getDataByStreams();
        this.arrayLocaleString = this.getArrayLocaleString();
    }
    @Output() hideDataset: EventEmitter<any> = new EventEmitter();
    @Output() messageDetails: EventEmitter<any> = new EventEmitter();
    @Input() menuOpen: boolean;
    get source(): Array<any> {
        return this._source;
    }
    constructor(
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef,
        private chartService: ChartsService
    ) { }

    ngOnInit() {
        this.chartService.getLegend.subscribe(legend => {
            if (!legend || legend.length === 0) {
                return;
            }
            this.legendItems = legend;
            this.dataByStreams = this.getDataByStreams();
            this.isLegend = true;
            this.cdr.detectChanges();
        });
    }
    showTooltip(message: any) {
        this.tooltipService.show(message);
    }
    hideTooltip() {
        this.tooltipService.hide();
    }
    private getStartEndTime() {
        const timeArray = this.source.map((i, k) => i.create_ts + k * 10);
        const { min, max } = Math;
        return {
            from: min(...timeArray),
            to: max(...timeArray)
        };
    }
    getLeftPercent(time: number): number {
        const { from, to } = this.getStartEndTime();
        return Math.max(0, Math.floor((to === from ? 0 : (time - from) / (to - from) * 99) * 2) / 2);
    }

    formattingDataArray() {
        this.dataTemplate = [];

        const groupedTransactions: any[] = Object.values(
            this.chartService.groupBy(
                this.source.map((i, k) => {
                    i.create_ts_inc = i.create_ts + k * 10;
                    return i;
                }).sort((itemA, itemB) => {
                    const a = itemA.create_ts_inc;
                    const b = itemB.create_ts_inc;
                    return a < b ? -1 : a > b ? 1 : 0;
                }), 'create_ts')
        ).map((item: any[]) =>
            item.find(k => Math.min(...item.map(i => i.MOS)) === k.MOS));

        groupedTransactions.forEach((item, key, source) => {
            const {
                srcAlias, dstAlias,
                source_ip, source_port,
                destination_ip, destination_port,
                messageType, create_ts,
                callid, message, create_ts_inc,
                ___index___, uuid
            } = item || {};

            const { MOS,
                MEAN_JITTER,
                MAX_JITTER,
                MAX_INTERARRIVAL_JITTER,
                MEAN_INTERARRIVAL_JITTER,
                CUM_PACKET_LOSS,
                FRACTION_LOSS,
                PACKET_LOSS,
                TYPE,
                SSRC
            } = message || {};
            const toTime = (source[key + 1] && source[key + 1].create_ts); // +10 sec

            const meanJITTER = messageType === 'RTP' ? MEAN_JITTER : MEAN_INTERARRIVAL_JITTER;
            const maxJITTER = messageType === 'RTP' ? MAX_JITTER : MAX_INTERARRIVAL_JITTER;
            const ellipsis = (txt) => txt.length > 14 ? `${txt.substring(0, 13)}... ` : txt;
            const dataItem: DataTemplateItem = {
                labelSrc: srcAlias ? `${ellipsis(srcAlias)}:${source_port}` : `${source_ip}:${source_port}`,
                srcTip: srcAlias && srcAlias.length > 14 ? srcAlias : '',
                labelDist: dstAlias ? `${ellipsis(dstAlias)}:${destination_port}` : `${destination_ip}:${destination_port}`,
                dstTip: dstAlias && dstAlias.length > 14 ? dstAlias : '',
                ipLabel: `${source_ip}:${source_port}`,
                data: [{
                    from: create_ts,
                    to: toTime,
                    index: ___index___,
                    fromPrecent: Math.max(0, this.getLeftPercent(create_ts_inc)),
                    toPrecent: 0,
                    mosColor: Functions.MOSColorGradient(MOS * 100),
                    messageType,
                    tooltipData: {
                        'MOS': `${MOS || 0}`,
                        'Mean Jitter': `${meanJITTER || 0}`,
                        'Max Jitter': `${maxJITTER || 0}`,
                        [(messageType === 'RTCP' ? 'Cum. ' : '') + 'Packet Loss']: `${CUM_PACKET_LOSS || PACKET_LOSS || 0}`,
                        'Fraction loss:': FRACTION_LOSS !== null && messageType === 'RTCP' && `${FRACTION_LOSS || 0}` || null,
                        'SSRC': SSRC,
                        'REPORT TYPE': `[${TYPE}]`,
                        [`[${messageType || 'RTP'}]`]: `${source_ip}:${source_port} -> ${destination_ip}:${destination_port}`,
                        'Alias': srcAlias,
                        'Origin': `${source_ip}:${source_port}`,
                        'CID': callid,
                        'Time': moment(create_ts).format('HH:mm:ss')
                        // , uuid: `(${___index___}) ${uuid}`
                    }
                }]
            };
            this.dataTemplate.push(dataItem);
        });
    }
    public getArrayLocaleString(): Array<any> {
        const maxTimeLabels = 10;
        const { from, to } = this.getStartEndTime();
        const n = 100;
        let stepX = (to - from) / n;
        let axisTimeArray = Array.from({ length: n }, (i, k) => from + stepX * k);
        const nLength = Functions.arrayUniques(axisTimeArray.map(i => moment(i).format('DD-MM-YYYY HH:mm:ss'))).length;
        stepX = (to - from) / nLength;
        axisTimeArray = Array.from({ length: nLength }, (i, k) => from + stepX * k);
        let arr = axisTimeArray; // Functions.arrayUniques(this._source.map(i => i.create_ts));

        const lastTime = arr[arr.length - 1];

        if (arr.length > maxTimeLabels) {
            arr = arr.filter((i, k, a) => k % Math.round(a.length / maxTimeLabels) === 0);
            if (arr[arr.length - 1] !== lastTime) {
                arr.push(lastTime);
            }
        }

        if (arr.length === 1) {
            arr.push(lastTime);
        }
        const t = (i, f) => moment(i).format(f);
        return arr.map(i => ({
            time: t(i, 'HH:mm:ss'),
            datetime: t(i, 'DD/MM/yy HH:mm:ss')
        }));
    }
    public getDataByStreams(): any {
        const preData = this.dataTemplate
            .map(i => ({ [`${i.labelSrc} ${i.data[0].messageType}`]: i as any }))
            .reduce((a: Array<any>, b: Array<any>) => {
                const [key] = Object.keys(b);
                a[key] = a[key] || [];
                a[key].push(b[key]);
                return a;
            }, {});
        const outStreams = Object.values(preData).map((stream: Array<any>) => {
            const [firstStream]: any = stream;
            const { ipLabel, labelSrc, srcTip, labelDist, dstTip } = firstStream;
            const data = [].concat(...stream.map(i => i.data));
            data.forEach((i, k, a) => {
                const _next = a[k + 1];
                if (k === 0) {
                    i.fromPrecent = 0;
                }
                if (_next) {
                    i.toPrecent = 100 - _next.fromPrecent ;
                } else {
                    i.fromPrecent = 99;
                    i.toPrecent = 0;
                }
            })
            const legendItem = this.legendItems &&
                this.legendItems.length > 0 &&
                this.legendItems.find(i => i.text === ipLabel);
            return {
                labelSrc, srcTip, labelDist, dstTip, data, legendItem
            };
        });
        const rtpStreams = outStreams.filter(i => i.data[0].messageType === 'RTP') || [{}];
        const rtcpStreams = outStreams.filter(i => i.data[0].messageType === 'RTCP') || [{}];
        const collectStreams = [];
        if (rtcpStreams) {
            rtpStreams.forEach(rtpItem => {
                collectStreams.push(rtpItem);
                const rtcpIndex = rtcpStreams.findIndex(i => rtpItem.labelSrc === i?.labelSrc);
                if (rtcpStreams[rtcpIndex]) {
                    collectStreams.push(rtcpStreams[rtcpIndex]);
                    rtcpStreams[rtcpIndex] = null;
                }
            });
        }
        collectStreams.push(...rtcpStreams.filter(i => i));
        return collectStreams || [];
    }
    public onClickRTP(data, event) {
        this.messageDetails.emit({ data, event });
        this.hideTooltip();
    }
    hideLegend(index) {
        this.chartService.hideDataset(index);
        this.chartService.storeLegend(this.legendItems);
    }
    legendItemValidate(stream) {
        return typeof stream !== 'undefined' && typeof stream.legendItem !== 'undefined';
    }

}
