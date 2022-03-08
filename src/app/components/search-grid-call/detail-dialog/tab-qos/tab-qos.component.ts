/**
 * https://github.com/jjppof/chartjs-plugin-zoom-pan-select
 */

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  HostListener,
  ElementRef
} from '@angular/core';
import { PreferenceAdvancedService } from '@app/services';
import { Chart, ChartType, ChartDataSets, ChartColor } from 'chart.js';
import { Label, Color, BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';

import { Functions } from '@app/helpers/functions';
import { WorkerService } from '@services/worker.service';

@Component({
  selector: 'app-tab-qos',
  templateUrl: './tab-qos.component.html',
  styleUrls: ['./tab-qos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabQosComponent implements OnInit, AfterViewInit {

  _qosData: any;
  chartWidthRTP = 100;
  chartWidthRTCP = 100;
  chartHeightRTP = 240;
  chartHeightRTCP
  @Input() callid;
  @Input() dataItem: any;
  @Input() set qosData(val: any) {

    if (!val) {
      return;
    }

    this._qosData = val;
    this.initQOSData();
  }
  get qosData(): any {
    return this._qosData;
  }
  @Input() id;
  @Output() ready: EventEmitter<any> = new EventEmitter();
  @Output() haveData = new EventEmitter();
  isError = false;
  errorMessage: any;
  @ViewChild('chartRTP', { static: false }) chartRTP: BaseChartDirective;
  @ViewChild('chartRTCP', { static: false }) chartRTCP: BaseChartDirective;
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
    elements: {
      line: {
        tension: 0 // disables bezier curves
      }
    },
    animation: {
      duration: 0 // general animation time
    },
    hover: {
      animationDuration: 0 // duration of animations when hovering an item
    },
    responsiveAnimationDuration: 0, // animation duration after a resize
    scales: {
      yAxes: [{
        ticks: {
          callback: this.yAxisFormatter.bind(this),
          beginAtZero: true
        }
      }]
    },
    showLines: false,
    legend: {
      display: false
    }
  };

  public chartLabelsRTCP: Label[] = [];
  public chartType: ChartType = 'bar';
  public chartLegend = true;

  public chartDataRTCP: ChartDataSets[] = [];

  public listRTP = [];

  public listRTCP = [];

  hideLabelsFlag = true;
  hideLabelsFlagRTP = true;
  streamsRTCP: Array<any> = [];
  streamsRTP: Array<any> = [];
  worker: WorkerService;
  _isLoaded: boolean = false;
  mosFraction: boolean = true;
  constructor(private cdr: ChangeDetectorRef, private _pas: PreferenceAdvancedService) {

    this._pas.getAll().toPromise().then(advanced => {
      if (advanced && advanced.data) {
        try {
          const setting = advanced.data.filter(i => i.category === 'system' && i.param === 'qos');
          if (setting && setting[0] && setting[0].data) {
            const { rtcp_mos_lost } = setting[0].data;
            if (rtcp_mos_lost && typeof rtcp_mos_lost === 'string' &&
              rtcp_mos_lost !== '' && rtcp_mos_lost == 'packets_lost') {
              this.mosFraction = false;
            }
          }
        } catch (err) { }
      }
    });


    this.worker = new WorkerService(new Worker(new URL('@app/workers/qos.worker', import.meta.url), { type: 'module' }));

  }
  
    @ViewChild('containerRTP', { static: false }) containerRTP: ElementRef;
    @ViewChild('flagsRTP', { static: false }) flagsRTP: ElementRef;
    @ViewChild('containerRTCP', { static: false }) containerRTCP: ElementRef;
    @ViewChild('flagsRTCP', { static: false }) flagsRTCP: ElementRef;
    @HostListener('window:resize')
    onResize() {
        this.chartHeightRTP = this.containerRTP?.nativeElement?.clientHeight - this.flagsRTP?.nativeElement?.clientHeight;        
        this.chartHeightRTCP = this.containerRTCP?.nativeElement?.clientHeight - this.flagsRTCP?.nativeElement?.clientHeight;
        this.cdr.detectChanges();
    }
  initQOSData() {
    const isData = this.qosData?.rtcp?.data?.length > 0 || this.qosData?.rtp?.data?.length > 0;
    this.haveData.emit(isData);
    this.ready.emit(isData);
    this.cdr.detectChanges();
    this.update('init', this.mosFraction, this.qosData);

  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.ready.emit({});
    }, 35);
  }
  async update(workerCommand: string, mosFraction: boolean, data: any) {

    const outData = await this.worker.getParseData({ workerCommand, mosFraction }, data);



    if (workerCommand === 'init') {
      this.isError = outData.isError as boolean;
      this.labels = outData.labels as Array<any>;
      this.isRTCP = outData.isRTCP as boolean;
      this.isRTP = outData.isRTP as boolean;
      this.isNoDataRTP = outData.isNoDataRTP as boolean;
      this.isNoDataRTCP = outData.isNoDataRTCP as boolean;
      this.chartDataRTP = outData.chartDataRTP as ChartDataSets[];
      this.chartLabelsRTP = outData.chartLabelsRTP as Label[];

      this.chartLabelsRTCP = outData.chartLabelsRTCP as Label[];

      this.chartType = outData.chartType as ChartType;
      this.chartLegend = outData.chartLegend as boolean;

      this.chartDataRTCP = outData.chartDataRTCP as ChartDataSets[];
      this.listRTP = outData.listRTP as Array<any>;
      this.listRTCP = outData.listRTCP as Array<any>;
      this.hideLabelsFlag = outData.hideLabelsFlag as boolean;
      this.hideLabelsFlagRTP = outData.hideLabelsFlagRTP as boolean;
      this.streamsRTCP = outData.streamsRTCP as Array<any>;
      this.streamsRTP = outData.streamsRTP as Array<any>;

      setTimeout(() => {
        this._isLoaded = true;
        const t = performance.now();
        this.cdr.detectChanges();
      });

    }
    if (['onChangeRTCP', 'onChangeRTP'].includes(workerCommand)) {
      /** for both */
      this.chartType = outData.chartType as ChartType;
      this.chartLegend = outData.chartLegend as boolean;

      /** for RTCP */
      this.isRTCP = outData.isRTCP as boolean;
      this.isNoDataRTCP = outData.isNoDataRTCP as boolean;
      this.chartLabelsRTCP = outData.chartLabelsRTCP as Label[];
      this.chartDataRTCP = outData.chartDataRTCP as ChartDataSets[];
      this.streamsRTCP = outData.streamsRTCP as Array<any>;

      /** for RTP */
      this.isRTP = outData.isRTP as boolean;
      this.isNoDataRTP = outData.isNoDataRTP as boolean;
      this.chartLabelsRTP = outData.chartLabelsRTP as Label[];
      this.chartDataRTP = outData.chartDataRTP as ChartDataSets[];
      this.streamsRTP = outData.streamsRTP as Array<any>;

      this._isLoaded = true;
      const t = performance.now();
      this.cdr.detectChanges();
    }
  }
  ngOnInit() {

    this.labels = this.dataItem.data.transaction_elements.map(i => i.call_data.map(q => q.sid )).join(',').split(',').reduce((a, b) => {
      if (a.indexOf(b) === -1) {
        a.push(b);
      }
      return a;
    }, []);
    this.initQOSData();
    this.color = Functions.getColorByString(this.callid, 75, 60, 1);
    this.cdr.detectChanges();

  }

  onChangeCheckBoxRTCP(item: any, type: any, base = false) {
    if (base) {
      item.packets = item.octets = item.highest_seq_no = item.ia_jitter = item.lsr =
        item.mos = item.packets_lost = item.fraction_lost = item._checked;
      item._indeterminate = false;
    } else {
      item._checked = item.packets && item.octets && item.highest_seq_no &&
        item.ia_jitter && item.lsr && item.mos && item.packets_lost && item.fraction_lost;
      item._indeterminate = !item._checked &&
        !(!item.packets && !item.octets && !item.highest_seq_no && !item.ia_jitter && !item.lsr &&
          !item.mos && !item.packets_lost && !item.fraction_lost);
    }

    this._isLoaded = false;
    this.cdr.detectChanges();
    setTimeout(async () => {
      // Hides disabled labels
      if (!base && this.chartRTCP) {
        const [checkArray] = this.streamsRTCP.map(stream => stream[type]);
        const index: number = this.chartRTCP.datasets.findIndex(i => i.label === type);
        this.chartRTCP.hideDataset(index, checkArray);
      }

      const mosFraction = true;
      await this.update('onChangeRTCP', this.mosFraction, { streamsRTCP: this.streamsRTCP });

      this.cdr.detectChanges();
    }, 10);

  }

  onChangeCheckBoxRTP(item: any, type: any, base = false) {
    if (base) {
      item.TOTAL_PK = item.EXPECTED_PK = item.JITTER = item.MOS = item.DELTA = item.PACKET_LOSS = item._checked;
      item._indeterminate = false;
    } else {
      item._checked = item.TOTAL_PK && item.EXPECTED_PK && item.JITTER && item.MOS && item.DELTA && item.PACKET_LOSS;
      item._indeterminate = !item._checked &&
        !(!item.TOTAL_PK && !item.EXPECTED_PK && !item.JITTER && !item.MOS && !item.DELTA && !item.PACKET_LOSS);
    }

    this._isLoaded = false;
    this.cdr.detectChanges();
    setTimeout(async () => {
      // Hides disabled labels
      if (!base && this.chartRTP) {
        const [checkArray] = this.streamsRTP.map(stream => stream[type]);
        const index: number = this.chartRTP.datasets.findIndex(i => i.label === type);
        this.chartRTP.hideDataset(index, checkArray);
      }

      await this.update('onChangeRTP', this.mosFraction, { streamsRTP: this.streamsRTP });
      this.cdr.detectChanges();
    }, 10);
  }

  yAxisFormatter(label) {
    return (num => {
      const f = i => Math.pow(1024, i);
      let n = 4;
      while (n-- && !(f(n) < num)) { }
      return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
    })(label);
  }
  onWheelRTP(event: any) {
    event.preventDefault();
    this.chartWidthRTP += event.deltaY / 10;
    this.chartWidthRTP = Math.max(100, this.chartWidthRTP);

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10);
  }
  onWheelRTCP(event) {
    event.preventDefault();
    this.chartWidthRTCP += event.deltaY / 10;
    this.chartWidthRTCP = Math.max(100, this.chartWidthRTCP);

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10);
  }
}
