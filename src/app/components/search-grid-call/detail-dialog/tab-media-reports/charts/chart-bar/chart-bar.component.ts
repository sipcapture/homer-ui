import { Component, OnInit, OnChanges, ChangeDetectorRef, ChangeDetectionStrategy, Input, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';

import { ChartsService, DataSets, MetricsMap } from '../charts.service';
import { TooltipService } from '@services/tooltip.service';
import { Functions } from '@app/helpers/functions';

import { Label, BaseChartDirective, Color } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import * as moment from 'moment';

export class DefaultChartOptions implements ChartOptions {
    responsive: boolean;
    maintainAspectRatio: boolean;
    scales: any;
    animation: any;
    constructor() {
        this.responsive = true;
        this.maintainAspectRatio = false;
        this.scales = {
            xAxes: [{}],
            yAxes: [{}]
        };
        this.animation = {
            duration: 0
        };
    }
}
@Component({
    selector: 'hep-chart-bar',
    templateUrl: './chart-bar.component.html',
    styleUrls: ['./chart-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartBarComponent implements OnInit, OnChanges, OnDestroy {
    public _source: any;
    public _metrics = 'mos';

    @Input() datasets: DataSets = [{ label: '', data: [], ports: [], uuids: [] }];

    @Input() options: any;
    @Input() colors: Color[] = [];
    labels: Label[] = [];
    @Input() legend = true;
    @Input() plugins: any[] = [];
    @Input() width = 100;  // %
    @Input() height = 200; // px

    @ViewChild(BaseChartDirective) private _chart: BaseChartDirective;

    isData = true;
    color: string;
    dataToolTipBuffer = '';
    private bufferData: string;
    legendItems: any;
    chartSubType: string;
    _chartType: ChartType | string = 'line';
    subscription;
    ___changesHASH = '';
    @Input() style: string;
    @Input() set source(val: any) {

        if (this.bufferData === JSON.stringify(val || {})) {
            return;
        }
        this.bufferData = JSON.stringify(val || {});
        this._source = val;
        this.reNewLegend();
    }

    get source(): any {
        return this._source;
    }

    @Output() legendGenerated: EventEmitter<any> = new EventEmitter();

    @Input() set metrics(val: string) {
        this._metrics = val;
        this.reNewLegend();
    }
    get metrics(): string {
        return this._metrics;
    }

    @Input() set chartType(val: any) {
        this._chartType = val;
        this.reNewLegend();
    }
    get chartType(): any {
        return this._chartType;
    }

    constructor(
        private chartsService: ChartsService,
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef
    ) {
        this.options = new DefaultChartOptions();
    }
    reNewLegend(): void {
        setTimeout(() => {
            this.update();
        });
    }
    update() {
        if (!this._source) {
            return;
        }
        const [firstItem] = this._source;
        const { callid } = firstItem || {};
        if (callid) {
            this.color = Functions.getColorByString(callid);
            this.setupChart();
            this.setData();
            this.cdr.detectChanges();

        }
    }
    ngOnInit() {
        this.setupChart();
        this.subscription = this.chartsService.getHiddenDataset.subscribe(datasetID => {
            try {
                const hidden = this.legendItems[datasetID].hidden;
                this.legendItems[datasetID].hidden = !hidden;
                this.setData();
            } catch (_) { }
        });
    }

    ngOnChanges(changes) {
        const h = Functions.md5object(changes);
        if (this.___changesHASH === h) {
            return;
        }
        this.___changesHASH = h;

        if (
            changes.chartType
            && typeof changes.chartType.currentValue !== 'undefined'
            && changes.chartType.previousValue !== changes.chartType.currentValue
        ) {
            const chartType = changes.chartType.currentValue;

            if (chartType === 'area') {
                this.chartType = 'line';
                this.chartSubType = 'area';
            } else {
                this.chartSubType = '';
            }
            this.update();
        }
    }
    private setupChart() {
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1,
                onComplete: () => {
                    this.createLegend();
                }
            },
            scales: {
                xAxes: [{
                    gridLines: { display: false },
                    ticks: {
                        minRotation: 45,
                        maxRotation: 45,
                    }
                }],
                yAxes: [{ ticks: { beginAtZero: true } }]
            },
            hover: { mode: 'point' },
            legendCallback: (item: any) => {
                return item.legend.legendItems;
            },
            tooltips: {
                // mode: 'index',
                // intersect: false,
                enabled: false,
                custom: tooltipModel => {
                    const dataToolTip = this.tooltipService.getTooltipMediaChart(tooltipModel, this.source, this.datasets, this.metrics);
                    if (this.dataToolTipBuffer === JSON.stringify(dataToolTip || {})) {
                        return;
                    }
                    this.dataToolTipBuffer = JSON.stringify(dataToolTip || {});

                    if (dataToolTip) {
                        this.showTooltip(dataToolTip);
                    } else {
                        this.dataToolTipBuffer = '';
                        this.hideTooltip();
                    }
                }
            }
        };
    }

    private setData() {
        let datasetTemplate = {};

        if (this.chartType === 'line') {
            datasetTemplate = {
                cubicInterpolationMode: 'monotone',
                fill: this.chartSubType === 'area' ? true : false,
                spanGaps: true
            };
        }
        const sourceCopy = this.source
            .filter(({ qosTYPE }) => ['PERIODIC', 'HANGUP'].includes(qosTYPE))
            .sort((itemA, itemB) => {
                const a = itemA.create_ts;
                const b = itemB.create_ts;
                return a < b ? -1 : a > b ? 1 : 0;
            });

        const { labels, datasets } = this.chartsService.getChartData(
            sourceCopy,
            this.metrics,
            datasetTemplate,
            this.chartType,
            this.legendItems?.filter(i => i.hidden === false).map(i => i.text)
        );

        this.labels = labels;
        this.datasets = datasets;
        this.isData = this.labels.length > 0;

        const metricLimits = this.metricLimits(sourceCopy, this.metrics);
        const ticks = this.options.scales.yAxes[0].ticks;
        if (this.metrics === 'skew') {
            ticks.min = Math.min(metricLimits.min, -2);
            ticks.max = Math.max(metricLimits.max, 2);
        } else if (this.metrics !== 'mos') {
            ticks.min = 0;
            ticks.max = metricLimits.max;
        } else {
            ticks.min = 0;
            ticks.max = 4.5;
        }
        this.cdr.detectChanges();
    }
    private metricLimits(transactions: any, metric: string = 'mos') {

        const { floor, ceil, min, max } = Math;
        const metricData = transactions.map(i => {
            // exception for JITTER
            let metricsMap;
            if (metric === 'jitter') {
                metricsMap = i.message.SOURCE === 'RTCP' ? 'MAX_INTERARRIVAL_JITTER' : 'MAX_JITTER';
            } else {
                metricsMap = MetricsMap[(metric as string)];
            }
            if (metric === 'pl') {
                return i.message[metricsMap] || i.message['PACKET_LOSS'];
            }
            return i.message[metricsMap];
        }).filter((t, i) => t && !isNaN(t) || i === 0);

        const limits = {
            min: floor(min(...metricData)) || 0,
            max: ceil(max(...metricData)) || 0
        };
        if (limits.max === 0 && limits.min === 0) {
            limits.max = 1;
        }

        return limits;
    }

    createLegend() {
        if (this.legendItems) {
            return;
        }
        const legendItems = Functions.cloneObject(this._chart.chart.generateLegend());
        if (Functions.md5object(legendItems) !== Functions.md5object(this.legendItems)) {
            this.chartsService.generateLegend(legendItems);
            this.legendItems = legendItems;
        }
    }
    showTooltip(item: any) {
        this.tooltipService.show(item);
        this.cdr.detectChanges();
    }

    hideTooltip() {
        this.tooltipService.hide();
        this.cdr.detectChanges();
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
