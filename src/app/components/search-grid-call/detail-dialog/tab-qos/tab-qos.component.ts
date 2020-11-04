/**
 * https://github.com/jjppof/chartjs-plugin-zoom-pan-select
 */

import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartType, ChartDataSets, ChartColor } from 'chart.js';
import { Label, Color, BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';

import { Functions } from '@app/helpers/functions';
import { WorkerService } from '../../../../services/worker.service';

@Component({
    selector: 'app-tab-qos',
    templateUrl: './tab-qos.component.html',
    styleUrls: ['./tab-qos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabQosComponent implements OnInit {
    _qosData: any;
    @Input() callid;
    @Input() dataItem: any;
    @Input() set qosData(val: any) {
        if (!val) {
            return;
        }
        this._qosData = val;

        (async () => await this.update('init', this.qosData))();
    }
    get qosData(): any {
        return this._qosData;
    }
    @Input() id;

    @Output() haveData = new EventEmitter();
    isError = false;
    errorMessage: any;
    @ViewChild('rtpChart', { static: false }) rtpChart: BaseChartDirective;
    @ViewChild('rtcpChart', { static: false }) rtcpChart: BaseChartDirective;
    color: any;
    labels: Array<any> = [];
    isRTCP = false;
    isRTP = false;
    isNoDataRTP = false;
    isNoDataRTCP = false;
    public chartDataRTP: ChartDataSets[] = [];

    public chartLabelsRTP: Label[] = [];


    public chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    callback: this.yAxisFormatter.bind(this),
                    beginAtZero: true
                }
            }]
        },
        legend: {
            display: false
        }
    };

    public chartLabels: Label[] = [];
    public chartType: ChartType = 'bar';
    public chartLegend = true;

    public chartData: ChartDataSets[] = [];

    public listRTP = [];

    public list = [];

    hideLabelsFlag = true;
    hideLabelsFlagRTP = true;
    streams: Array<any> = [];
    streamsRTP: Array<any> = [];
    worker: WorkerService;

    constructor(private cdr: ChangeDetectorRef) {
        console.log('constructor::new WorkerService');
        this.worker = new WorkerService(new Worker('@app/qos.worker', { type: 'module' }));
    }

    async update(workerCommand: string, data: any) {
        const outData = await this.worker.getParseData({ workerCommand }, data);

        if (workerCommand === 'init') {
            this.isError = outData.isError as boolean;
            this.labels = outData.labels as Array<any>;
            this.isRTCP = outData.isRTCP as boolean;
            this.isRTP = outData.isRTP as boolean;
            this.isNoDataRTP = outData.isNoDataRTP as boolean;
            this.isNoDataRTCP = outData.isNoDataRTCP as boolean;
            this.chartDataRTP = outData.chartDataRTP as ChartDataSets[];
            this.chartLabelsRTP = outData.chartLabelsRTP as Label[];

            this.chartLabels = outData.chartLabels as Label[];
            this.chartType = outData.chartType as ChartType;
            this.chartLegend = outData.chartLegend as boolean;

            this.chartData = outData.chartData as ChartDataSets[];
            this.listRTP = outData.listRTP as Array<any>;
            this.list = outData.list as Array<any>;
            this.hideLabelsFlag = outData.hideLabelsFlag as boolean;
            this.hideLabelsFlagRTP = outData.hideLabelsFlagRTP as boolean;
            this.streams = outData.streams as Array<any>;
            this.streamsRTP = outData.streamsRTP as Array<any>;

            // this.cdr.detectChanges();
        }
        if (['onChangeRTCP', 'onChangeRTP'].includes(workerCommand)) {
            this.isRTCP = outData.isRTCP as boolean;
            this.isRTP = outData.isRTP as boolean;
            this.isNoDataRTP = outData.isNoDataRTP as boolean;
            this.isNoDataRTCP = outData.isNoDataRTCP as boolean;
            this.chartDataRTP = outData.chartDataRTP as ChartDataSets[];
            this.chartLabelsRTP = outData.chartLabelsRTP as Label[];

            this.chartLabels = outData.chartLabels as Label[];
            this.chartType = outData.chartType as ChartType;
            this.chartLegend = outData.chartLegend as boolean;

            this.chartData = outData.chartData as ChartDataSets[];
            this.streams = outData.streams as Array<any>;

            this.cdr.detectChanges();
        }
    }
    ngOnInit() {
        this.labels = this.dataItem.data.calldata.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);

        this.color = Functions.getColorByString(this.callid, 75, 60, 1);
        this.cdr.detectChanges();
    }

    async onChangeCheckBox(item: any, type: any, base = false) {
        if (base) {
            item.packets = item.octets = item.highest_seq_no = item.ia_jitter = item.lsr = item.mos = item.packets_lost = item._checked;
            item._indeterminate = false;
        } else {
            item._checked = item.packets && item.octets && item.highest_seq_no &&
                item.ia_jitter && item.lsr && item.mos && item.packets_lost;
            item._indeterminate = !item._checked &&
                !(!item.packets && !item.octets && !item.highest_seq_no && !item.ia_jitter && !item.lsr && !item.mos && !item.packets_lost);
        }


        // Hides disabled labels
        if (!base && this.rtcpChart) {
            const [checkArray] = this.streams.map(stream => stream[type]);
            const index: number = this.rtcpChart.datasets.findIndex(i => i.label === type);
            this.rtcpChart.hideDataset(index, checkArray);
        }

        this.cdr.detectChanges();

        await this.update('onChangeRTCP', { item, type, base, streams: this.streams });

        this.cdr.detectChanges();

    }

    async onChangeCheckBoxRTP(item: any, type: any, base = false) {
        if (base) {
            item.TOTAL_PK = item.EXPECTED_PK = item.JITTER = item.MOS = item.DELTA = item.PACKET_LOSS = item._checked;
            item._indeterminate = false;
        } else {
            item._checked = item.TOTAL_PK && item.EXPECTED_PK && item.JITTER && item.MOS && item.DELTA && item.PACKET_LOSS;
            item._indeterminate = !item._checked &&
                !(!item.TOTAL_PK && !item.EXPECTED_PK && !item.JITTER && !item.MOS && !item.DELTA && !item.PACKET_LOSS);
        }

        // Hides disabled labels
        if (!base && this.rtpChart) {
            const [checkArray] = this.streamsRTP.map(stream => stream[type]);
            const index: number = this.rtpChart.datasets.findIndex(i => i.label === type);
            this.rtpChart.hideDataset(index, checkArray);
        }
        this.cdr.detectChanges();

        await this.update('onChangeRTCP', { item, type, base, streamsRTP: this.streamsRTP });

        this.cdr.detectChanges();
    }

    yAxisFormatter(label) {
        return (num => {
            const f = i => Math.pow(1024, i);
            let n = 4;
            while (n-- && !(f(n) < num)) { }
            return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
        })(label);
    }
}
