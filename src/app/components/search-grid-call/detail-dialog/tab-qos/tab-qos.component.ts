import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartType, ChartDataSets, ChartColor } from 'chart.js';
import { Label, Color, BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';

import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-tab-qos',
    templateUrl: './tab-qos.component.html',
    styleUrls: ['./tab-qos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabQosComponent implements OnInit {
    @Input() callid;
    @Input() dataItem: any;
    @Input() qosData: any;
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
    public chartDataRTP: ChartDataSets[] = [
        {
            data: [],
            label: 'TOTAL_PK',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'EXPECTED_PK',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'JITTER',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'MOS',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'DELTA',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'PACKET_LOSS',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        },
    ];

    public chartLabelsRTP: Label[] = [];
    public lineChartColorsRTP: Color[] = [];

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
    public lineChartColors: Color[] = [];
    public chartData: ChartDataSets[] = [
        {
            data: [],
            label: 'packets',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0,
        }, {
            data: [],
            label: 'octets',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'highest_seq_no',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'ia_jitter',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'lsr',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'mos',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        }, {
            data: [],
            label: 'packets_lost',
            backgroundColor: [],
            hoverBackgroundColor: [],
            fill: false,
            borderWidth: 0
        },
    ];

    public listRTP = [
        { name: 'min TOTAL_PK', value: Number.MAX_VALUE, color: 'color1' },
        { name: 'avg TOTAL_PK', value: 0, color: 'color1' },
        { name: 'max TOTAL_PK', value: 0, color: 'color1' },

        { name: 'min EXPECTED_PK', value: Number.MAX_VALUE, color: 'color2' },
        { name: 'avg EXPECTED_PK', value: 0, color: 'color2' },
        { name: 'max EXPECTED_PK', value: 0, color: 'color2' },

        { name: 'min JITTER', value: Number.MAX_VALUE, color: 'color3' },
        { name: 'avg JITTER', value: 0, color: 'color3' },
        { name: 'max JITTER', value: 0, color: 'color3' },

        { name: 'min MOS', value: Number.MAX_VALUE, color: 'color4' },
        { name: 'avg MOS', value: 0, color: 'color4' },
        { name: 'max MOS', value: 0, color: 'color4' },

        { name: 'min DELTA', value: Number.MAX_VALUE, color: 'color5' },
        { name: 'avg DELTA', value: 0, color: 'color5' },
        { name: 'max DELTA', value: 0, color: 'color5' },

        { name: 'min PACKET_LOSS', value: Number.MAX_VALUE, color: 'color6' },
        { name: 'avg PACKET_LOSS', value: 0, color: 'color6' },
        { name: 'max PACKET_LOSS', value: 0, color: 'color6' },
    ];

    public list = [
        { name: 'min packets', value: Number.MAX_VALUE, color: 'color1' },
        { name: 'avg packets', value: 0, color: 'color1' },
        { name: 'max packets', value: 0, color: 'color1' },

        { name: 'min octets', value: Number.MAX_VALUE, color: 'color2' },
        { name: 'avg octets', value: 0, color: 'color2' },
        { name: 'max octets', value: 0, color: 'color2' },

        { name: 'min highest_seq_no', value: Number.MAX_VALUE, color: 'color3' },
        { name: 'avg highest_seq_no', value: 0, color: 'color3' },
        { name: 'max highest_seq_no', value: 0, color: 'color3' },

        { name: 'min ia_jitter', value: Number.MAX_VALUE, color: 'color4' },
        { name: 'avg ia_jitter', value: 0, color: 'color4' },
        { name: 'max ia_jitter', value: 0, color: 'color4' },

        { name: 'min lsr', value: Number.MAX_VALUE, color: 'color5' },
        { name: 'avg lsr', value: 0, color: 'color5' },
        { name: 'max lsr', value: 0, color: 'color5' },

        { name: 'min mos', value: Number.MAX_VALUE, color: 'color6' },
        { name: 'avg mos', value: 0, color: 'color6' },
        { name: 'max mos', value: 0, color: 'color6' },

        { name: 'min packets_lost', value: Number.MAX_VALUE, color: 'color7' },
        { name: 'avg packets_lost', value: 0, color: 'color7' },
        { name: 'max packets_lost', value: 0, color: 'color7' },
    ];

    hideLabelsFlag = true;
    hideLabelsFlagRTP = true;
    streams: Array<any> = [];
    streamsRTP: Array<any> = [];

     constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.labels = this.dataItem.data.calldata.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);
        try {
            this.parseRTCP(this.qosData.rtcp.data);
            this.parseRTP(this.qosData.rtp.data);
            this.haveData.emit(this.qosData.rtcp.data.length > 0 || this.qosData.rtp.data.length > 0 );
        } catch (err) {
            this.onErrorMessage(err);
        }
        this.color = Functions.getColorByString(this.callid,75,60,1);
    }
    onErrorMessage(err: any) {
        this.isError = true;
        console.error(new Error(err));
    }
    parseRTP(data) {
        if (!data || data.length === 0) {
            this.isRTP = false;
            return;
        }
        this.chartLabelsRTP = [];
        data.forEach(item => {
            try {
                item.raw = JSON.parse(item.raw);
            } catch (err) {
                this.onErrorMessage(err);
                return;
            }

            const i = item.raw;
            this.chartLabelsRTP.push(moment( item.create_date ).format('YYYY-MM-DD HH:mm:ss'));

            if (this.streamsRTP.filter((j: any) => j.dstIp === item.dstIp && j.srcIp === item.srcIp).length === 0) {
                this.streamsRTP.push({
                    dstIp: item.dstIp,
                    srcIp: item.srcIp,
                    create_date: [],
                    _indeterminate: false,
                    _checked: true,
                    TOTAL_PKData: [],
                    TOTAL_PK: true,
                    EXPECTED_PKData: [],
                    EXPECTED_PK: true,
                    JITTERData: [],
                    JITTER: true,
                    MOSData: [],
                    MOS: true,
                    DELTAData: [],
                    DELTA: true,
                    PACKET_LOSSData: [],
                    PACKET_LOSS: true,
                });
            }
            this.streamsRTP.forEach((k: any) => {
                if (k.dstIp === item.dstIp && k.srcIp === item.srcIp) {
                    k.create_date.push ( item.create_date );

                    // TOTAL_PK
                    k.TOTAL_PKData.push(i.TOTAL_PK);

                    // EXPECTED_PK
                    k.EXPECTED_PKData.push(i.EXPECTED_PK);

                    // JITTER
                    k.JITTERData.push(i.JITTER);

                    // MOS
                    k.MOSData.push(i.MOS);

                    // DELTA
                    k.DELTAData.push(i.DELTA);

                    // PACKET_LOSS
                    k.PACKET_LOSSData.push(i.PACKET_LOSS);


                    // min TOTAL_PK
                    if (!isNaN(i.TOTAL_PK)) {
                        this.listRTP[0].value = Math.min(this.listRTP[0].value, i.TOTAL_PK * 1);
                    }
                    // max TOTAL_PK
                    if (!isNaN(i.TOTAL_PK)) {
                        this.listRTP[2].value = Math.max(this.listRTP[2].value, i.TOTAL_PK * 1);
                    }

                    // min EXPECTED_PK
                    if (!isNaN(i.EXPECTED_PK)) {
                        this.listRTP[3].value = Math.min(this.listRTP[3].value, i.EXPECTED_PK * 1);
                    }

                    // max EXPECTED_PK
                    if (!isNaN(i.EXPECTED_PK)) {
                        this.listRTP[5].value = Math.max(this.listRTP[5].value, i.EXPECTED_PK * 1);
                    }

                    // min JITTER
                    if (!isNaN(i.JITTER)) {
                        this.listRTP[6].value = Math.min(this.listRTP[5].value, i.JITTER * 1);
                    }
                    // max JITTER
                    if (!isNaN(i.JITTER)) {
                        this.listRTP[8].value = Math.max(this.listRTP[8].value, i.JITTER * 1);
                    }

                    // min MOS
                    if (!isNaN(i.MOS)) {
                        this.listRTP[9].value = Math.min(this.listRTP[9].value, i.MOS * 1);
                    }
                    // max MOS
                    if (!isNaN(i.MOS)) {
                        this.listRTP[11].value = Math.max(this.listRTP[11].value, i.MOS * 1);
                    }

                    // min DELTA
                    if (!isNaN(i.DELTA)) {
                        this.listRTP[12].value = Math.min(this.listRTP[12].value, i.DELTA * 1);
                    }
                    // max DELTA
                    if (!isNaN(i.DELTA)) {
                        this.listRTP[14].value = Math.max(this.listRTP[14].value, i.DELTA * 1);
                    }

                    // min PACKET_LOSS
                    if (!isNaN(i.PACKET_LOSS)) {
                        this.listRTP[15].value = Math.min(this.listRTP[15].value, i.PACKET_LOSS * 1);
                    }
                    // max PACKET_LOSS
                    if (!isNaN(i.PACKET_LOSS)) {
                        this.listRTP[17].value = Math.max(this.listRTP[17].value, i.PACKET_LOSS * 1);
                    }
                }
            });
        });

        this.listRTP.forEach(item => {
            item.value = item.value === Number.MAX_VALUE ? 0 : item.value;
        });

        this.listRTP[1].value = parseFloat(((this.listRTP[0].value + this.listRTP[2].value) / 2).toFixed(2));
        this.listRTP[4].value = parseFloat(((this.listRTP[3].value + this.listRTP[5].value) / 2).toFixed(2));
        this.listRTP[7].value = parseFloat(((this.listRTP[6].value + this.listRTP[8].value) / 2).toFixed(2));
        this.listRTP[10].value = parseFloat(((this.listRTP[9].value + this.listRTP[11].value) / 2).toFixed(2));
        this.listRTP[13].value = parseFloat(((this.listRTP[12].value + this.listRTP[14].value) / 2).toFixed(2));
        this.listRTP[16].value = parseFloat(((this.listRTP[15].value + this.listRTP[17].value) / 2).toFixed(2));

        this.renderChartData(this.streamsRTP, this.chartDataRTP);

        this.isRTP = true;
    }

    parseRTCP(data) {
        if (!data || data.length === 0) {
            this.isRTCP = false;
            return;
        }
        this.chartLabels = [];
        data.forEach(item => {
            try {
                item.raw = JSON.parse(item.raw);
            } catch (err) {
                this.onErrorMessage(err);
                return;
            }

            if ( (1 * item.raw.type !== 200 && 1 * item.raw.type !== 202) || !item.raw.sender_information ) {
                return;
            }

            const i = item.raw;

            this.chartLabels.push(moment( item.create_date ).format('YYYY-MM-DD HH:mm:ss'));

            if (this.streams.filter((j: any) => j.dstIp === item.dstIp && j.srcIp === item.srcIp).length === 0) {
                this.streams.push({
                    dstIp: item.dstIp,
                    srcIp: item.srcIp,
                    create_date: [],
                    _indeterminate: false,
                    _checked: true,
                    packetsData: [],
                    packets: true,
                    octetsData: [],
                    octets: true,
                    highest_seq_noData: [],
                    highest_seq_no: true,
                    ia_jitterData: [],
                    ia_jitter: true,
                    packets_lostData: [],
                    packets_lost: true,
                    lsrData: [],
                    lsr: true,
                    mosData: [],
                    mos: true
                });
            }
            this.streams.forEach((k: any) => {
                if (k.dstIp === item.dstIp && k.srcIp === item.srcIp) {
                    k.create_date.unshift( item.create_date );

                    // packets
                    k.packetsData.push(i.sender_information.packets);

                    // octets
                    k.octetsData.push(i.sender_information.octets);

                    if (i.report_blocks && i.report_blocks[0]) {
                        const block = i.report_blocks[0];
                        const tmpMos = Math.round(this.calculateJitterMos({
                            rtt: (block.dlsr < 1000 ? block.dlsr : 0) ,
                            jitter: block.ia_jitter,
                            numpacketlost: block.packets_lost
                        }) * 100) / 100; // => 0.00

                        /**
                         * render chart
                         */
                        // highest_seq_no
                        k.highest_seq_noData.push(block.highest_seq_no);

                        // ia_jitter
                        k.ia_jitterData.push(block.ia_jitter);

                        // packets_lost
                        k.packets_lostData.push(block.packets_lost);

                        // lsr
                        k.lsrData.push(block.lsr * 1);

                        // mos
                        k.mosData.push(tmpMos * 1);
                        /* end chart */

                        if (!isNaN(i.sender_information.packets)) {
                            // min packets
                            this.list[0].value = Math.min(this.list[0].value, i.sender_information.packets * 1);
                            // max packets
                            this.list[2].value = Math.max(this.list[2].value, i.sender_information.packets * 1);
                        }

                        if (!isNaN(i.sender_information.octets)) {
                            // min octets
                            this.list[3].value = Math.min(this.list[3].value, i.sender_information.octets * 1);
                            // max octets
                            this.list[5].value = Math.max(this.list[5].value, i.sender_information.octets * 1);
                        }

                        if (!isNaN(block.highest_seq_no)) {
                            // min highest_seq_no
                            this.list[6].value = Math.min(this.list[6].value, block.highest_seq_no * 1);
                            // max highest_seq_no
                            this.list[8].value = Math.max(this.list[8].value, block.highest_seq_no * 1);
                        }

                        if (!isNaN(block.ia_jitter)) {
                            // min ia_jitter
                            this.list[9].value = Math.min(this.list[9].value, block.ia_jitter * 1);
                            // max ia_jitter
                            this.list[11].value = Math.max(this.list[11].value, block.ia_jitter * 1);
                        }

                        if (!isNaN(block.lsr)) {
                            // min lsr
                            this.list[12].value = Math.min(this.list[12].value, block.lsr * 1);
                            // max lsr
                            this.list[14].value = Math.max(this.list[14].value, block.lsr * 1);
                        }

                        if (!isNaN(tmpMos)) {
                            // min mos
                            this.list[15].value = Math.min(this.list[15].value, tmpMos * 1);
                            // max mos
                            this.list[17].value = Math.max(this.list[17].value, tmpMos * 1);
                        }

                        if (!isNaN(block.packets_lost)) {
                            // min packets_lost
                            this.list[18].value = Math.min(this.list[18].value, block.packets_lost * 1);
                            // max packets_lost
                            this.list[20].value = Math.max(this.list[20].value, block.packets_lost * 1);
                        }


                    } else {
                        // highest_seq_no
                        k.highest_seq_noData.push(0);

                        // ia_jitter
                        k.ia_jitterData.push(0);

                        // packets_lost
                        k.packets_lostData.push(0);

                        // lsr
                        k.lsrData.push(0);

                        // mos
                        k.mosData.push(0);
                    }
                }
            });
        });

        this.list.forEach(item => {
            item.value = item.value === Number.MAX_VALUE ? 0 : item.value;
        });

        // avg packets
        this.list[1].value = this.average(this.streams, 'packetsData');

        // avg octets
        this.list[4].value = this.average(this.streams, 'octetsData');

        // avg highest_seq_no
        this.list[7].value = this.average(this.streams, 'highest_seq_noData');

        // avg ia_jitter
        this.list[10].value = this.average(this.streams, 'ia_jitterData');

        // avg lsr
        this.list[13].value = this.average(this.streams, 'lsrData');

        // avg mos
        this.list[16].value = this.average(this.streams, 'mosData');

         // avg packets_lost
         this.list[19].value = this.average(this.streams, 'packets_lostData');

        this.renderChartData(this.streams, this.chartData);
        this.isRTCP = true;
    }
    private average(streams, labelData) {
        try {
            const t = streams.map(i => i[labelData].reduce((a, b) => (a += b, a), 0) / i[labelData].filter(e => e > 0).length);
            const out = t.reduce((a, b) => (a += b, a), 0) / t.filter(e => e > 0).length;
            return isNaN(out) ? 0 : Math.round(out * 100) / 100;
        } catch (err) {
            console.error(err);
        }
    }
    private renderChartData(streams, chartData) {
        chartData.forEach(i => {
            i.data = [];
            i.backgroundColor = [];
            i.hoverBackgroundColor = [];
        });
        streams.forEach(item => {
            chartData.forEach(val => {
                const unique = item.srcIp + val.label + item.dstIp;
                const rColor = this.setColor( unique );
                const arrData = val.data as Array<number> || [];
                const _data = this.getData(item, val.label);
                const arrBackgroundColor = val.backgroundColor as Array<string> || [];
                const arrHoverBackgroundColor = val.hoverBackgroundColor as Array<string> || [];

                val.data = arrData.concat(_data);

                item[val.label + '_color'] = rColor.backgroundColor;

                val.backgroundColor = arrBackgroundColor
                    .concat(Array.from({ length: _data.length }, i => rColor.backgroundColor) );
                val.hoverBackgroundColor = arrHoverBackgroundColor
                    .concat(Array.from({ length: _data.length }, i => rColor.borderColor));
            });

        });
        this.cdr.detectChanges();
    }

    private setColor( str: string) {
        const rColor = Functions
            .getColorByStringHEX(str)
                .match(/.{2}/g)
                    .map(i => parseInt(i, 16))
                        .join(', ');

        const rColor100 = `rgba(${rColor}, 1)`;
        const rColor50 = `rgba(${rColor}, 0.5)`;

        return {
            backgroundColor: rColor50,
            borderColor: rColor100
        };
    }
    private getData(item: any, label: string) {
        const data = item[label + 'Data'] as Array<number> || [];
        if (item[label]) {
            return Functions.cloneObject( data );
        }
        return Array.from({ length: data.length }, i => 0);
    }

    onChangeCheckBox(item: any, type: any, base = false) {          
        let _indeterminate = item._indeterminate;
        if (base) {
            item.packets = item.octets = item.highest_seq_no = item.ia_jitter = item.lsr = item.mos = item.packets_lost = item._checked;
            item._indeterminate = false;
        } else {
            item._checked = item.packets && item.octets && item.highest_seq_no &&
                item.ia_jitter && item.lsr && item.mos && item.packets_lost;
            item._indeterminate = !item._checked &&
                !(!item.packets && !item.octets && !item.highest_seq_no && !item.ia_jitter && !item.lsr && !item.mos && !item.packets_lost);
        }
        let checkArray = [];   
            this.streams.forEach(stream => checkArray.push(stream[type]));
        
        let index: number;
        if(this.rtcpChart != undefined){ 
            for(let i = 0; i < this.rtcpChart.datasets.length;i++){
                if(this.rtcpChart.datasets[i].label === type){
                    index = i;
                }
            }
        }
        let streamsCopy = Functions.cloneObject(this.streams);
        //Removes disabled datastream
        streamsCopy = streamsCopy.filter(lStream =>  lStream._checked || lStream._indeterminate);
        this.streams.forEach((stream) => {             
            if(!stream._checked && !stream._indeterminate){
                stream.create_date.forEach(create_date => this.chartLabels = this.chartLabels.filter(label=> label != moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
            }else if(stream._checked || stream._indeterminate){  
                stream.create_date.forEach(create_date => this.chartLabels = this.chartLabels.filter(label=> label != moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
                stream.create_date.forEach(create_date => this.chartLabels.push(moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
            }
        })
        if(streamsCopy.length === 0){
            this.isNoDataRTCP = true;
        }else{
            this.isNoDataRTCP = false;
        };      
        //Hides disabled labels
        if(!base && this.rtcpChart != undefined){
            if(checkArray.every(x => x == false)){
                this.rtcpChart.hideDataset(index,true)
            }else{
                this.rtcpChart.hideDataset(index,false)
          }
        }
        this.renderChartData(streamsCopy, this.chartData);
    }

    onChangeCheckBoxRTP(item: any, type: any, base = false) {

        let _indeterminate = item._indeterminate;
        if (base) {
            item.TOTAL_PK = item.EXPECTED_PK = item.JITTER = item.MOS = item.DELTA = item.PACKET_LOSS = item._checked;
            item._indeterminate = false;
        } else {
            item._checked = item.TOTAL_PK && item.EXPECTED_PK && item.JITTER && item.MOS && item.DELTA && item.PACKET_LOSS;
            item._indeterminate = !item._checked &&
                !(!item.TOTAL_PK && !item.EXPECTED_PK && !item.JITTER && !item.MOS && !item.DELTA && !item.PACKET_LOSS);
        }
        let checkArray = [];
        this.streamsRTP.forEach(stream => checkArray.push(stream[type]));
        let index: number;
        if(this.rtpChart != undefined){
            for(let i = 0; i < this.rtpChart.datasets.length;i++){
                if(this.rtpChart.datasets[i].label === type){
                    index = i;
                }
            }
        }
        let streamsCopy = Functions.cloneObject(this.streamsRTP);
        //Removes disabled datastream            
        streamsCopy = streamsCopy.filter(lStream =>  lStream._checked || lStream._indeterminate);
        this.streamsRTP.forEach((stream) => {  
            if(!stream._checked && !stream._indeterminate){
                stream.create_date.forEach(create_date => this.chartLabelsRTP = this.chartLabelsRTP.filter(label=> label != moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
            }else if(stream._checked || stream._indeterminate){  
                stream.create_date.forEach(create_date => this.chartLabelsRTP = this.chartLabelsRTP.filter(label=> label != moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
                stream.create_date.forEach(create_date => this.chartLabelsRTP.push(moment( create_date ).format('YYYY-MM-DD HH:mm:ss')))
            }
        })                     

        //Hides disabled labels
        if(!base && this.rtpChart != undefined){
            if(checkArray.every(x => x == false)){
               this.rtpChart.hideDataset(index,true)
            }else{
               this.rtpChart.hideDataset(index,false)   
            }
        }       
        if(streamsCopy.length === 0){
            this.isNoDataRTP = true;
        }else{
            this.isNoDataRTP = false;
        };    
        this.renderChartData(streamsCopy, this.chartDataRTP);

    }

    yAxisFormatter (label) {
        return ((num) => {
            const f = i => Math.pow(1024, i);
            let n = 4;
            while (n-- && !(f(n) < num)) {}
            return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
        })(label);
    }


    private calculateJitterMos({jitter, numpacketlost, rtt = 0}) {
        if (rtt === 0) {
            rtt = 10;
        }

        const effective_latency = rtt + (jitter * 2) + 10;

        let mos_val = 0;
        let r_factor = 0;

        if (effective_latency < 160) {
            r_factor = 93.2 - (effective_latency / 40);
        } else {
            r_factor = 93.2 - (effective_latency - 120) / 10;
        }

        r_factor = r_factor - (numpacketlost * 2.5);
        if (r_factor > 100) {
            r_factor = 100;
        } else if (r_factor < 0) {
            r_factor = 0;
        }
        mos_val = 1 + (0.035) * (r_factor) + (0.000007) * (r_factor) * ((r_factor) - 60) * (100 - (r_factor));

        if (mos_val > 4.7) {
            mos_val = 4.7;
        }
        return (mos_val);
    }
}
