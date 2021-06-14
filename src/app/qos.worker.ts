/// <reference lib="webworker" />

import * as moment from 'moment';


class QosProcessor {
    public isError = false;
    public errorMessage: any;
    public color: any;
    public labels: Array<any> = [];
    public isRTCP = false;
    public isRTP = false;
    public isNoDataRTP = false;
    public isNoDataRTCP = false;
    public chartDataRTP: Array<any> = [
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

    public chartLabelsRTP: Array<any> = [];

    public chartLabels: Array<any> = [];
    public chartType: any = 'bar';
    public chartLegend = true;

    public chartData: Array<any> = [
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
        }, {
            data: [],
            label: 'fraction_lost',
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

        { name: 'min fraction_lost', value: Number.MAX_VALUE, color: 'color8' },
        { name: 'avg fraction_lost', value: 0, color: 'color8' },
        { name: 'max fraction_lost', value: 0, color: 'color8' },
    ];

    public hideLabelsFlag = true;
    public hideLabelsFlagRTP = true;
    public streams: Array<any> = [];
    public streamsRTP: Array<any> = [];

    public init(srcdata, mosFraction) {

        try {
            this.parseRTCP(srcdata.rtcp.data, mosFraction);
            this.parseRTP(srcdata.rtp.data);
            // this.haveData.emit(this.qosData.rtcp.data.length > 0 || this.qosData.rtp.data.length > 0);
        } catch (err) { }
    }
    public onChangeRTP({ streamsRTP }) {
        this.streamsRTP = streamsRTP || [];
        this.onChangeCheckBoxRTP();
    }
    public onChangeRTCP({ streams }) {
        this.streams = streams || [];
        this.onChangeCheckBox();
    }

    private parseRTP(data) {
        if (!data || data.length === 0) {
            this.isRTP = false;
            return;
        }
        this.chartLabelsRTP = [];
        data.forEach(item => {

            item.raw = JSON.parse(item.raw);


            const i = item.raw;
            this.chartLabelsRTP.push(moment(item.create_date).format('HH:mm:ss'));

            if (this.streamsRTP.filter((j: any) => j.dstIp === item.dstIp && j.srcIp === item.srcIp).length === 0) {
                this.streamsRTP.push({
                    dstIp: item.dstIp,
                    srcIp: item.srcIp,
                    create_date: [],
                    _indeterminate: true,
                    _checked: true,
                    TOTAL_PKData: [],
                    TOTAL_PK: false,
                    EXPECTED_PKData: [],
                    EXPECTED_PK: false,
                    JITTERData: [],
                    JITTER: false,
                    MOSData: [],
                    MOS: true,
                    DELTAData: [],
                    DELTA: false,
                    PACKET_LOSSData: [],
                    PACKET_LOSS: false,
                });
            }
            this.streamsRTP.forEach((k: any) => {
                if (k.dstIp === item.dstIp && k.srcIp === item.srcIp) {
                    k.create_date.push(item.create_date);

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

        this.renderChartData(this.streamsRTP, this.chartDataRTP, false);

        this.isRTP = true;
    }

    private parseRTCP(data, mosFraction) {
        if (!data || data.length === 0) {
            this.isRTCP = false;
            return;
        }

        let uc = /\u0010/;

        data.map(m => {
            m.raw = m.raw.replace(uc, '.')
        })

        data = data.map(i => (i.raw = JSON.parse(i.raw), i))
            .filter(({ raw }) => raw?.sender_information &&
                raw?.sender_information?.packets &&
                raw?.sender_information?.octets);
        data.forEach(item => {
            const i = item.raw

            if (![200, 201, 202].includes(1 * i.type)) {
                return;
            }

            // this.chartLabels.push(moment( item.create_date ).format('HH:mm:ss'));

            if (this.streams.filter((j: any) => j.dstIp === item.dstIp && j.srcIp === item.srcIp).length === 0) {
                this.streams.push({
                    dstIp: item.dstIp,
                    srcIp: item.srcIp,
                    create_date: [],
                    _indeterminate: true,
                    _checked: false,
                    packetsData: [],
                    packets: false,
                    octetsData: [],
                    octets: false,
                    highest_seq_noData: [],
                    highest_seq_no: false,
                    ia_jitterData: [],
                    ia_jitter: false,
                    packets_lostData: [],
                    packets_lost: false,
                    fraction_lostData: [],
                    fraction_lost: false,
                    lsrData: [],
                    lsr: false,
                    mosData: [],
                    mos: true
                });
            }
            this.streams.forEach((k: any) => {
                if (k.dstIp === item.dstIp && k.srcIp === item.srcIp) {
                    k.create_date.push(item.create_date);

                    // packets
                    if (typeof i.sender_information === 'undefined') {
                        k.packetsData.push(0);
                    } else {
                        k.packetsData.push(i.sender_information.packets);
                    }
                    // octets
                    if (typeof i.sender_information === 'undefined') {
                        k.octetsData.push(0);
                    } else {
                        k.octetsData.push(i.sender_information.octets);
                    }

                    const [block] = i.report_blocks || [];
                    if (block) {

                        let numPL = block.packets_lost;

                        if (mosFraction) {
                            if (block.fraction_lost <= 0) {
                                numPL = 0;
                            }
                            else if (block.fraction_lost > 256 ) {
                                numPL = 100;
                            }
                            else {
                                numPL = numPL / 256 * 100;
                            }
                        }

                        const tmpMos = Math.round(this.calculateJitterMos({
                            rtt: (block.dlsr < 1000 ? block.dlsr : 0),
                            jitter: block.ia_jitter,
                            numpacketlost: numPL
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

                        // fraction_lost
                        if (block.fraction_lost <= 0 ) {
                            k.fraction_lostData.push(0);
                        } else {
                            k.fraction_lostData.push(block.fraction_lost / 256);
                        }
                        // lsr
                        k.lsrData.push(block.lsr * 1);

                        // mos
                        k.mosData.push(tmpMos * 1);
                        /* end chart */

                        if (typeof i.sender_information === 'undefined') {
                            this.list[0].value = 0;
                            this.list[2].value = 0;
                        } else if (!isNaN(i.sender_information.packets)) {
                            // min packets
                            this.list[0].value = Math.min(this.list[0].value, i.sender_information.packets * 1);
                            // max packets
                            this.list[2].value = Math.max(this.list[2].value, i.sender_information.packets * 1);
                        }

                        if (typeof i.sender_information === 'undefined') {
                            this.list[3].value = 0;
                            this.list[5].value = 0;
                        } else if (!isNaN(i.sender_information.octets)) {
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

                        if (!isNaN(block.fraction_lost)) {
                            // min fraction_lost
                            this.list[21].value = Math.min(this.list[21].value, block.fraction_lost * 1);
                            // max fraction_lost
                            this.list[23].value = Math.max(this.list[23].value, block.fraction_lost * 1);
                        }

                    } else {
                        // highest_seq_no
                        k.highest_seq_noData.push(0);

                        // ia_jitter
                        k.ia_jitterData.push(0);

                        // packets_lost
                        k.packets_lostData.push(0);

                        // fraction_lost
                        k.fraction_lostData.push(0);

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

        // avg fraction_lost
        this.list[21].value = this.average(this.streams, 'fraction_lostData');

        this.renderChartData(this.streams, this.chartData, true);
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
    private renderChartData(streams, chartData, isRTCP = true) {
        if (isRTCP) {
            this.chartLabels = [];
        } else {
            this.chartLabelsRTP = [];
        }
        chartData.forEach(i => {
            i.data = [];
            i.backgroundColor = [];
            i.hoverBackgroundColor = [];
        });
        const streamItems = [];

        streams.forEach(item => {
            if (isRTCP) {
                for (let i = 0; i < item.create_date.length; i++) {
                    streamItems.push({
                        create_date: [item.create_date[i]],
                        dstIp: item.dstIp,
                        highest_seq_no: item.highest_seq_no,
                        highest_seq_noData: [item.highest_seq_noData[i]],
                        // highest_seq_no_color: item.highest_seq_no_color,
                        ia_jitter: item.ia_jitter,
                        ia_jitterData: [item.ia_jitterData[i]],
                        // ia_jitter_color: item.ia_jitter_color,
                        lsr: item.lsr,
                        lsrData: [item.lsrData[i]],
                        // lsr_color: item.lsr_color,
                        mos: item.mos,
                        mosData: [item.mosData[i]],
                        // mos_color: item.mos_color,
                        octets: item.octets,
                        octetsData: [item.octetsData[i]],
                        // octets_color: item.octets_color,
                        packets: item.packets,
                        packetsData: [item.packetsData[i]],
                        // packets_color: item.packets_color,
                        packets_lost: item.packets_lost,
                        packets_lostData: [item.packets_lostData[i]],
                        // packets_lost_color: item.packets_lost_color,
                        fraction_lost: item.fraction_lost,
                        fraction_lostData: [item.fraction_lostData[i]],
                        srcIp: item.srcIp,
                        _checked: item._checked,
                        _indeterminate: item._indeterminate,
                        parent_stream: item
                    });
                }
            } else {
                // for RTP
                for (let i = 0; i < item.create_date.length; i++) {
                    streamItems.push({
                        dstIp: item.dstIp,
                        srcIp: item.srcIp,
                        create_date: [item.create_date[i]],
                        _indeterminate: item._indeterminate,
                        _checked: item._checked,
                        TOTAL_PKData: [item.TOTAL_PKData[i]],
                        TOTAL_PK: item.TOTAL_PK,
                        EXPECTED_PKData: [item.EXPECTED_PKData[i]],
                        EXPECTED_PK: item.EXPECTED_PK,
                        JITTERData: [item.JITTERData[i]],
                        JITTER: item.JITTER,
                        MOSData: [item.MOSData[i]],
                        MOS: item.MOS,
                        DELTAData: [item.DELTAData[i]],
                        DELTA: item.DELTA,
                        PACKET_LOSSData: [item.PACKET_LOSSData[i]],
                        PACKET_LOSS: item.PACKET_LOSS,
                        parent_stream: item
                    });
                }
            }
        });

        streamItems.sort((a, b) => {
            a = new Date(a.create_date[0]).getTime();
            b = new Date(b.create_date[0]).getTime();
            return a < b ? -1 : a > b ? 1 : 0;
        });

        streamItems.forEach(item => {

            const [create_date] = item.create_date;
            if (isRTCP) {
                this.chartLabels.push(moment(create_date).format('HH:mm:ss'));
            } else {
                this.chartLabelsRTP.push(moment(create_date).format('HH:mm:ss'));
            }

            chartData.forEach(val => {
                const unique = item.srcIp + val.label + item.dstIp;
                const rColor = this.setColor(unique);
                const arrData = val.data as Array<number> || [];
                const _data = this.getData(item, val.label);
                const arrBackgroundColor = val.backgroundColor as Array<string> || [];
                const arrHoverBackgroundColor = val.hoverBackgroundColor as Array<string> || [];

                val.data = arrData.concat(_data);

                item.parent_stream[val.label + '_color'] = rColor.backgroundColor;

                val.backgroundColor = arrBackgroundColor
                    .concat(Array.from({ length: _data.length }, i => rColor.backgroundColor));
                val.hoverBackgroundColor = arrHoverBackgroundColor
                    .concat(Array.from({ length: _data.length }, i => rColor.borderColor));
            });

        });

    }
    private setColor(str: string) {

        /* lets make it more uniq */
        let hash = 0, i, chr;
        for (i = 0; i < str.length; i++) {
             chr   = str.charCodeAt(i);
             hash  = ((hash << 5) - hash) + chr;
             hash |= 0; // Convert to 32bit integer
        }

        const rColor = this.getColorByStringHEX(hash.toString())
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
            return this.cloneObject(data);
        }
        return Array.from({ length: data.length }, i => 0);
    }

    private getColorByStringHEX(str: string) {
        if (str.toLowerCase() === 'log') {
            return 'FFA562';
        }
        let hash = 0;
        let i = 0;

        for (i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        i = hash;
        let col = ((i >> 24) & 0xAF).toString(16) + ((i >> 16) & 0xAF).toString(16) +
            ((i >> 8) & 0xAF).toString(16) + (i & 0xAF).toString(16);
        if (col.length < 6) {
            col = col.substring(0, 3) + '' + col.substring(0, 3);
        }
        if (col.length > 6) {
            col = col.substring(0, 6);
        }
        return col;
    }

    private cloneObject(src: any): any {
        try {
            return JSON.parse(JSON.stringify(src));
        } catch (err) { }

        return src;
    }
    private calculateJitterMos({ jitter, numpacketlost, rtt = 0}) {
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

    onChangeCheckBox() {
        const streamsCopy = this.streams.filter(lStream => lStream._checked || lStream._indeterminate);
        this.isNoDataRTCP = streamsCopy.length === 0;

        this.renderChartData(streamsCopy, this.chartData, true);
    }

    onChangeCheckBoxRTP() {
        const streamsCopy = this.streamsRTP.filter(lStream => lStream._checked || lStream._indeterminate);
        this.isNoDataRTP = streamsCopy.length === 0;
        this.renderChartData(streamsCopy, this.chartDataRTP, false);

    }
}

const qp = new QosProcessor();

addEventListener('message', ({ data }) => {
    const { metaData, srcdata } = JSON.parse(data);

    if (metaData && metaData.workerCommand) {

        qp[metaData.workerCommand](srcdata, metaData.mosFraction);

        const response = JSON.stringify(qp);
        postMessage(response);
    } else {
        postMessage(JSON.stringify({ error: 'metaData.workerCommand is undefined' }));
    }
});
