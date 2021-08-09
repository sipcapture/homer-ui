import { Component, Input, EventEmitter, Output, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Functions } from '@app/helpers/functions';
import * as moment from 'moment';
import { AlertService } from '@app/services/alert.service';
import * as bogon from 'bogon';
import { PreferenceMappingProtocolService } from '@app/services/preferences/mapping-protocol.service';
import { PreferenceAdvancedService, TooltipService } from '@app/services';
import { TranslateService } from '@ngx-translate/core';
import { CopyService } from '@app/services/copy.service';

enum COLOR {
    green = '#15ad15',
    greenlighter = '#64e364',
    darkgreen = '#9fbb00',
    orange = '#ffcf78',
    orange_jitter = '#ff9019',
    orangelighter = '#ffd599',
    yellow = '#fff2cc',
    yellowlighter = '#fee528',
    red = '#f78989',
    red_jitter = '#d42828',
    redlighter = '#F54A4A',
    grey = '#eeeeee',
    darkgrey = '#555555',
    greylighter = '#bab8b8',
    corporate = '#e3ecfa',
}
interface CustomSetting {
    args: string;  // function argumnets args: 'a,b'
    body: string; // function body  body: 'return a + b;'
    func: string; // function name  func: 'jitter'
}
enum MEDIA_PARAMS {
    //jitter
    minJitter = 'MIN_JITTER',
    meanJitter = 'MEAN_JITTER',
    maxJitter = 'MAX_JITTER',
    interarrivalJitter = 'INTERARRIVAL_JITTER',
    maxInterarrivalJitter = 'MAX_INTERARRIVAL_JITTER',
    meanInterarrivalJitter = 'MEAN_INTERARRIVAL_JITTER',
    //mos
    minMos = 'MIN_MOS',
    meanMos = 'MEAN_MOS',
    maxMos = 'MAX_MOS',
    //rfactor
    minRFactor = 'MIN_RFACTOR',
    meanRFactor = 'MEAN_RFACTOR',
    maxRFactor = 'MAX_RFACTOR',
    //skew
    maxSkew = 'MAX_SKEW',
    minSkew = 'MIN_SKEW',
    //packets
    totalPackets = 'TOTAL_PACKETS',
    totalExpectedPackets = 'TOTAL_EXPECTED_PK',
    totalPacketLoss = 'TOTAL_PACKET_LOSS',
    cumPacketLoss = 'CUM_PACKET_LOSS',
    fractionLoss = 'FRACTION_LOSS',
    maxFractionLoss = 'MAX_FRACTION_LOSS',
    totalRTCPPK = 'TOTAL_RTCP_PK'
}




enum TASK_TYPE {
    number = 1,
    chart = 3,
    html = 4,
    stats = 5,
    object = 6,
    packets = 7,
    codecs = 8,
    ipgroup = 9,
    hidden = 404,
}
enum JITTER_WARNING {
    warning = 20,
    danger = 30
}
@Component({
    selector: 'app-tab-callinfo',
    templateUrl: './tab-callinfo.component.html',
    styleUrls: ['./tab-callinfo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabCallinfoComponent implements AfterViewInit {
    hostinfo: any;
    ipAlias: any = [];
    alias: any;
    callTransaction: Array<any> = [];
    rtpagentReports: any = {};
    F = Functions;
    jitter = 0;
    overflowlimit = 21;
    objectKeys = Object.keys;
    currentMapping = [];
    public pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
            // mode: 'index',
            // intersect: false,
            enabled: false,
            custom: tooltipModel => {
                if (typeof tooltipModel.body !== 'undefined') {
                    this.showTooltip(tooltipModel.body[0].lines[0]);

                } else {
                    this.hideTooltip();
                }
            }
        }
    };
    dataToolTipBuffer: string;
    channelIdMessageDetails: any;
    thisWindowId: any;

    // match this one for custom function settings

    customSettings: any = {}
    customArgs: any = {}

    messages = [];
    jitterSetting = [];
    arrData = [];
    privateDetect = /(^192\.168\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])$)|(^172\.([1][6-9]|[2][0-9]|[3][0-1])\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])$)|(^10\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])\.([0-9]|[0-9][0-9]|[0-2][0-5][0-5])$)/gm;
    privateTest = /^(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\..*/;
    wSettings // warnings from settings
    settingJittWarn
    public pieChartType: any = 'doughnut';
    @Input() set dataItem(_dataItem) {
        const clone = Functions.cloneObject;
        this.messages = _dataItem?.data?.messages;
        this.alias = clone(_dataItem.data.alias);
        this.thisWindowId = _dataItem.data.callid.join('---');

        const CallTransactionData = clone(_dataItem?.data?.data);

        const CallTransactionSorted = (clone(_dataItem?.data?.data?.transaction))?.sort((a, b) => {
            const status_a = a.status;
            const status_b = b.status;
            if (status_a < status_b) {
                return -1;
            }
            if (status_a > status_b) {
                return 1;
            }
            return 0;
        });

        const CallReportRTCP = clone(
            _dataItem.data.messages
                .filter((i) => (i?.QOS?.message?.TYPE))
                .map(i => i.source_data)
                .filter(f => f.type === 'RTCP'));
        const CallReportQos = clone(
            _dataItem.data.messages
                .filter((i) => (i?.QOS?.message?.TYPE))
                .map((i) => i.source_data)
                .filter((f, i, a) => !!(f?.QOS?.message?.TYPE === 'FINAL')));
        this.initSession(
            CallTransactionSorted,
            CallReportRTCP,
            CallReportQos
        );
        this.initKnownHost(CallTransactionData);
    }
    @Output() ready: EventEmitter<any> = new EventEmitter();

    constructor(
        private alertService: AlertService,
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef,
        private mappingService: PreferenceMappingProtocolService,
        private translateService: TranslateService,
        private _pas: PreferenceAdvancedService,
        private copyService: CopyService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')



    }

    ngAfterViewInit() {

       // custom settings functions call
            // set custom functions on advanced settings => category : session-info, param: warnings
            /**
             * Sample (Jitter warning function):
             * {
                    "args": "maxJitter,meanJitter",  ==> function arguments
                    "body": "return ((maxJitter / meanJitter) * 100) > 500;",  ==> function body
                    "func": "jitter" ==> constraint name
    }
             *
             */

        this._pas.getSetting('warnings', 'session-info').then(data => {

            if (data) {
                const d = data[0]
                const jitterData = d?.jitter || null;
                if (jitterData) {
                    const jitterFunc = new Function(jitterData?.args, jitterData?.body);
                    this.customSettings['jitter'] = jitterFunc
                    this.customArgs['jitter'] = jitterData?.args?.split(',').map(m => MEDIA_PARAMS[m])
                }
            }
        })
        setTimeout(() => {
            this.ready.emit({});
        }, 35);
    }

    private getServerType({ sIn, sOut }) {
        let sType = '';

        if (sIn === 'core' && sOut === 'bp') {
            sType = 'access';
        } else if (sIn === 'bp' && sOut === 'core') {
            sType = 'access';
        } else if (sIn === 'gw' && sOut === 'core') {
            sType = 'platform';
        } else if (sIn === 'core' && sOut === 'gw') {
            sType = 'platform';
        } else if (sOut === 'gw' || sIn === 'gw') {
            sType = 'carrier';
        } else if (sOut === 'bp' || sIn === 'bp') {
            sType = 'access';
        } else {
            sType = 'access';
        }
        return sType;
    }

    private async initSession(trans: any, rtcp: any, qos: any) {
        this.callTransaction = trans || [];

        const getzero = (ip: string) => ip.substring(ip.length, ip.length - 2) === ':0' ? ip.substring(0, ip.length - 2) : ip;
        const ipsfiltered = (Object.keys(this.alias)).map(m => ({ name: this.alias[m], value: getzero(m) }));
        const mapAlias = (ip, port) => ipsfiltered?.find(f => [ip, port].includes(f?.value))?.name
            || ip;
        this.callTransaction?.forEach(async transaction => {
            transaction.destination_ip = await mapAlias(transaction.destination_ip, transaction.destination_port) + `:${transaction.destination_port}`;
            transaction.source_ip = await mapAlias(transaction.source_ip, transaction.source_port) + `:${transaction.source_port}`;
        });
        this.callTransaction.forEach((trans_item) => {
            const { server_type_out, server_type_in } = trans_item;


            if (server_type_out !== undefined || server_type_in !== undefined) {
                trans_item.segment_type = this.getServerType({
                    sIn: server_type_in,
                    sOut: server_type_out,
                });
            }

            trans_item.transaction = trans_item.table.split('_').pop();

            /** tasks for each CallId */
            trans_item.task = [];

            /* messages array */
            if (trans_item['Methods->Key'] && trans_item['Methods->Key'].length > 0) {
                /* chart of messages */
                trans_item.chart = {
                    type: TASK_TYPE.chart,
                    title: 'Methods',
                    /** body is chart data */
                    color:COLOR.grey,
                    link: 'https://tools.ietf.org/html/rfc3665#page-12',
                    label: trans_item['Methods->Key'],
                    value: trans_item['Methods->Value'],
                };

            }
            if (trans_item['cdr_ringing'] && trans_item['cdr_ringing'] > 0) {
                let val: any;
                const stop =
                    trans_item['cdr_connect'] && trans_item['cdr_connect'] > 0
                        ? trans_item['cdr_connect']
                        : trans_item['cdr_stop'];
                val = ((stop - trans_item['cdr_ringing']) / 1000000).toFixed(2);
                if (
                    trans_item['cdr_connect'] === 0 &&
                    trans_item['cdr_stop'] > 0 &&
                    trans_item['cdr_ringing'] > 0
                ) {
                    val = (trans_item['cdr_stop'] - trans_item['cdr_ringing']).toFixed(2);
                }
                if (trans_item['cdr_stop'] <= 0) {
                    val = ((Date.now() * 1000 - trans_item['cdr_ringing']) / 1000000).toFixed(2);
                }
                trans_item.task.push({
                    title: 'Ringing Time',
                    color: COLOR.yellow,
                    type: TASK_TYPE.number,
                    body: val,
                    prefix: 'sec',
                });
            }

            if (trans_item['duration'] && this.secFormatter(trans_item['duration']) !== 'Invalid date') {
                trans_item.task.push({
                    title: 'Duration',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    body: this.secFormatter(trans_item['duration']),
                    prefix: '',
                });
            }

            trans_item.task.push({
                title: 'Status',
                color:
                    this.getColorByMapping(trans_item['status']) ||
                    COLOR.grey,
                type: TASK_TYPE.number,
                abs: trans_item['status'],
                body: this.getStatusByMapping(trans_item['status']),
                prefix: '',
            });

            if (trans_item['uas'] && trans_item['uas'] !== '') {
                trans_item['uac'] = {
                    title: 'UAC',
                    color: COLOR.yellow,
                    type: TASK_TYPE.number,
                    link: 'https://tools.ietf.org/html/rfc3261#page-34',
                    description: 'User Agent Server',
                    body: trans_item['uas'],
                    prefix: '',
                };
            }

            if (
                trans_item['geo_cc'] &&
                trans_item['geo_cc'] !== '' &&
                trans_item['dest_cc'] &&
                trans_item['dest_cc'] !== ''
            ) {
                trans_item.task.push({
                    title: 'Geolocation',
                    grid: '1 / 4 / 1 / 5',
                    color: COLOR.grey,
                    type: TASK_TYPE.object,
                    body: {
                        in: trans_item['dest_cc'],
                        out: trans_item['geo_cc'],
                    },
                    prefix: '',
                });
            }
            if (
                trans_item['dest_cc'] &&
                trans_item['dest_cc'] !== '' &&
                trans_item['geo_cc'] === ''
            ) {
                trans_item.task.push({
                    title: 'GEO to',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    body: trans_item['dest_cc'],
                    prefix: '',
                });
            }
            if (
                trans_item['geo_cc'] &&
                trans_item['geo_cc'] !== '' &&
                trans_item['dest_cc'] === ''
            ) {
                trans_item.task.push({
                    title: 'GEO to',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    body: trans_item['dest_cc'],
                    prefix: '',
                });
            }
            if (
                trans_item['expire_rep'] &&
                trans_item['expire_rep'] !== ''
            ) {
                trans_item.task.push({
                    title: 'Expire Reply',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    body: trans_item['expire_rep'],
                    prefix: 's',
                });
            }
            if (trans_item['expire_req'] && trans_item['expire_req'] !== '') {
                trans_item.task.push({
                    title: 'Expire Request',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    body: trans_item['expire_req'],
                    prefix: 'ms',
                });
            }

            if (trans_item['rrd'] && trans_item['rrd'] !== '' && trans_item['rrd'] !== 0) {
                trans_item.task.push({
                    title: 'Registration Request Delay',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    link: 'https://tools.ietf.org/html/rfc6076#page-8',
                    body: trans_item['rrd'] / 1000,
                    prefix: 'ms',
                });
            }

            if (trans_item['srd'] && trans_item['srd'] !== '' && trans_item['srd'] !== 0) {
                trans_item.task.push({
                    title: 'Session Request Delay',
                    color: COLOR.grey,
                    type: TASK_TYPE.number,
                    link: 'https://tools.ietf.org/html/rfc6076#page-10',
                    body: trans_item['srd'] / 1000,
                    prefix: 'ms',
                });
            }

            if (trans_item['Metrics->Key'] && trans_item['Metrics->Key'].length > 0) {
                let idx: number = trans_item['Metrics->Key'].indexOf('MOS_G');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        title: 'MOS',
                        color: this.colorByMeanMos(val)['background'],
                        font: this.colorByMeanMos(val)['color'],
                        type: TASK_TYPE.stats,
                        abs: val,
                        link: 'https://tools.ietf.org/html/rfc7266#page-3',
                        body: parseFloat(val).toFixed(2),
                        prefix: '',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('SRD');
                if (idx !== -1 && !trans_item['srd']) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        title: 'Session Request Delay',
                        color: COLOR.grey,
                        type: TASK_TYPE.stats,
                        link: 'https://tools.ietf.org/html/rfc6076#page-8',
                        body: val / 1000,
                        prefix: 'ms',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('SSS');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        title: 'Successful Session Setup',
                        color: COLOR.grey,
                        type: TASK_TYPE.stats,
                        link: 'https://tools.ietf.org/id/draft-ietf-pmol-sip-perf-metrics-04.html#anchor8',
                        body: val / 1000,
                        prefix: 'ms',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('FSS');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        title: 'Failed Session Setup',
                        color: COLOR.grey,
                        type: TASK_TYPE.stats,
                        link: 'https://tools.ietf.org/id/draft-ietf-pmol-sip-perf-metrics-04.html#anchor9',
                        body: val / 1000,
                        prefix: 'ms',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('PTT_G');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        title: 'PTT',
                        color: COLOR.grey,
                        type: TASK_TYPE.stats,
                        body: val,
                        prefix: '',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('JT_G');
                if (idx !== -1) {

                    const val = trans_item['Metrics->Value'][idx];

                    trans_item.task.push({
                        title: 'Jitter',
                        color: this.jitterCheck(val)['background'],
                        font: this.jitterCheck(val)['font'],
                        type: TASK_TYPE.stats,
                        link: 'https://tools.ietf.org/html/rfc3550#page-94',
                        body: val,
                        prefix: 'tu',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('PKTPL_G');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        ID: 'PKTPL_G',
                        title: 'Packet Lost',
                        color: COLOR.grey,
                        type: TASK_TYPE.hidden,
                        link: 'https://tools.ietf.org/html/rfc3611#page-27',
                        body: val,
                        prefix: '',
                    });
                }

                idx = trans_item['Metrics->Key'].indexOf('PKTEXP_G');
                if (idx !== -1) {
                    const val = trans_item['Metrics->Value'][idx];
                    trans_item.task.push({
                        ID: 'PKTEXP_G',
                        title: 'Packets Expected',
                        color: COLOR.grey,
                        type: TASK_TYPE.hidden,
                        link: 'https://tools.ietf.org/html/rfc4689#page-16',
                        body: val,
                        prefix: '',
                    });
                }

                const pktExp = trans_item.task.find((f: any) => f.ID === 'PKTEXP_G');
                const pktLost = trans_item.task.find((f: any) => f.ID === 'PKTPL_G');
                if (pktExp.body !== 0) {
                    trans_item.task.push({
                        title: 'Packets Stats',
                        grid: '2 / 2 / 2 / 3',
                        color: COLOR.corporate,
                        type: TASK_TYPE.packets,
                        body: {
                            expected: pktExp.body,
                            lost: pktLost.body,
                            total: pktExp.body ? ((pktLost.body * 100) / pktExp.body).toFixed(0) : 0,
                        },
                        prefix: '',
                    });
                }
            }

            if (
                trans_item['server_type_in'] !== '' &&
                trans_item['server_type_out'] === ''
            ) {
                trans_item.task.push({
                    title: 'Server Type In',
                    color: COLOR.grey,
                    type: TASK_TYPE.object,
                    body: {
                        in: trans_item['server_type_in'],
                        out: '',
                    },
                });
            }

            if (
                trans_item['server_type_out'] !== '' &&
                trans_item['server_type_in'] === ''
            ) {
                trans_item.task.push({
                    title: 'Server Type Out',
                    color: COLOR.grey,
                    type: TASK_TYPE.object,
                    body: {
                        in: '',
                        out: trans_item['server_type_out'],
                    },
                });
            }
            /** HTML content */
            if (
                trans_item['server_type_in'] &&
                trans_item['server_type_out'] !== ''
            ) {
                trans_item.task.push({
                    title: 'Server Type',
                    color: COLOR.grey,
                    type: TASK_TYPE.object,
                    body: {
                        in: trans_item['server_type_in'],
                        out: trans_item['server_type_out'],
                    },
                });
            }
            if (
                trans_item['ipgroup_in'] &&
                trans_item['ipgroup_in'] !== '' &&
                trans_item['ipgroup_out'] !== ''
            ) {
                trans_item.task.push({
                    title: 'IP Group',
                    color: COLOR.grey,
                    type: TASK_TYPE.ipgroup,
                    body: {
                        in: trans_item['ipgroup_in'],
                        out: trans_item['ipgroup_out'],
                    },
                });
            }
            if (
                trans_item['ipgroup_in'] &&
                trans_item['ipgroup_in'] !== '' &&
                trans_item['ipgroup_out'] === ''
            ) {
                trans_item.task.push({
                    title: 'IP Group In',
                    color: COLOR.grey,
                    type: TASK_TYPE.ipgroup,
                    body: { in: trans_item['ipgroup_in'], out: '' },
                });
            }
            if (
                trans_item['ipgroup_out'] &&
                trans_item['ipgroup_out'] !== '' &&
                trans_item['ipgroup_in'] === ''
            ) {
                trans_item.task.push({
                    title: 'IP Group Out',
                    color: COLOR.grey,
                    type: TASK_TYPE.ipgroup,
                    body: { in: '', out: trans_item['ipgroup_out'] },
                });
            }
        });

        if (qos && qos.length === 0) {
            return;
        }
        qos.push(rtcp[rtcp.length - 1]);
        this.rtpagentReports = {};

        const callids = qos
            .map((i: any) => i?.QOS?.callid || [])
            .sort()
            .filter((q: any, w: any, e: any) => q !== e[w - 1]);

        callids.forEach((callid: string) => {
            this.rtpagentReports[callid] = qos
                .filter((i: any) => i?.QOS?.callid === callid)
                .map((i: any) => {
                    const ips = [i.QOS.source_ip, i.QOS.destination_ip];

                    const tested = this.arrTest(ips);
                    // test private to public warning
                    const [srcPrivate, dstPrivate] = tested;
                    const warning = JSON.stringify([false, true]);
                    const stats = Functions.cloneObject(i.QOS.message);

                    // Jitter warning
                    let maxJitter = 0
                    let meanJitter = 0
                    let JittWarn = false
                    if (stats && this.customArgs?.jitter) {
                        try {
                            // customSettings: setting function
                            // customArgs: setting args
                            const jitterStats = this.customArgs?.jitter?.map(m => stats?.[m])
                            JittWarn = this.customSettings.jitter(...jitterStats) || false
                        } catch (e) {

                            console.log(e)
                        }

                    } else {

                        maxJitter = stats?.MAX_JITTER || stats?.MAX_INTERARRIVAL_JITTER;
                        meanJitter = stats?.MEAN_JITTER || stats?.INTERARRIVAL_JITTER;

                    }

                    const warnings = {
                        ssrc_chg: stats?.SSRC_CHG > 0,
                        video: stats?.VIDEO > 0,
                        out_order: stats?.OUT_ORDER > 0,
                        big_down_jump: stats?.BIG_DOWN_JUMP > 0,
                        mos: stats?.MEAN_MOS < 4,
                        jitt: JittWarn || this.jittWarn(maxJitter, meanJitter),
                        nat: JSON.stringify(tested) === warning,
                    }

                    const hasWarnings = Object.values(warnings).includes(true)

                    return {
                        callid: i.callid,
                        id: i.id,
                        ip: i.QOS.capture_ip,
                        data: i.QOS.message,
                        src_ip: i.srcAlias || i.source_ip,
                        dest_ip: i.dstAlias || i.destination_ip,

                        src_port: i.source_port,
                        dest_port: i.destination_port,
                        hasWarning: hasWarnings,
                        warnings: warnings,
                        dst: dstPrivate,
                        src: srcPrivate
                    };
                });
        });
    }

    //TODO: add pure functions as helpers

    public arrTest(a) {
        return (a.map(m => bogon.isPrivate(m)));
    }

    public ellipsisFormat(txt) {
        return txt?.length > this.overflowlimit ? txt?.substring(0, this.overflowlimit) + '... ' : txt;
    }
    public ellipsed(txt) {
        return txt?.length > this.overflowlimit ? txt : '';
    }

    public jittWarn(meanJitt, maxJitt) {
        return ((maxJitt / meanJitt) * 100) > 500;
    }

    public toggleCallInfo(id: string) {
        const div = document.getElementById(id);
        let canceled = false;

        if (div.classList.contains('isCanceled')) { canceled = true; }
        const icon = document.getElementById(id + '-icon');
        if (div.style.display === 'block') {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
        } else if (div.style.display === 'none' || canceled) {
            div.style.display = 'block';
            icon.innerHTML = 'keyboard_arrow_down';
        } else {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
        }
    }

    private jitterCheck(val) {
        if (val <= JITTER_WARNING.warning) {
            return { background: COLOR.grey, font: '' };
        } else if (val > JITTER_WARNING.warning && val <= JITTER_WARNING.danger) {
            return { background: COLOR.orange, font: COLOR.orange_jitter };
        } else { return { background: COLOR.red, font: COLOR.red_jitter }; }
    }
    private initKnownHost(trans: any) {
        const kh = trans.hostinfo;
        if (Object.keys(kh).length > 0) {
            const ip = {};
            const hosts = Object.keys(kh);
            hosts.forEach(host => {
                ip[host] = {
                    Alias: kh[host].alias,
                    Group: kh[host].group,
                    Mask: kh[host].mask,
                    ShardID: kh[host].shardid,
                    Status: (kh[host].status ? 'Active' : 'Inactive'),
                    Type: kh[host].type,
                    IPV6: kh[host].ipv6
                };
            });
            this.hostinfo = kh ? { Host: ip } : null;

        } else {
            this.hostinfo = 0;
        }
    }

    color(str: string) {
        return Functions.getColorByString(str);
    }

    public chartGetData(data: any, type: string) {

        if (type === 'data') {
            return data.value || [];
        } else if (type === 'label') {
            return data.label || [];
        }
    }

    public chartConfigurate(data: any) {
        const chartValue: Array<number> = data.value || [];
        const chartLabel: Array<number> = data.label || [];
        const arLab = chartLabel.map(label => ({ label }));
        const arVal = chartValue.map(value => ({ value }));

        return {
            data: arLab.map((item, i) => Object.assign({}, item, arVal[i])),
            showInLegend: false,
            legend: {
                enabled: false,
            },
            autoSize: true,
            width: 300,
            height: 300,
            title: {
                text: data.title,
                fontSize: 12,
            },
            series: [
                {
                    type: 'pie',
                    angleKey: 'value',
                    labelKey: 'label',
                    outerRadiusOffset: -80,
                },
            ],
            label: {
                enable: false,
                fontSize: 8,
                minAngle: 0,
            },
        };
    }

    public colorByMeanMos(mos: number): any {
        if (mos === 0) {
            return { background: COLOR.grey, color: COLOR.darkgrey };
        } else if (mos < 2) {
            return { background: COLOR.redlighter, color: COLOR.red_jitter };
        } else if (mos <= 3.5) {
            return { background: COLOR.orangelighter, color: COLOR.orange_jitter };
        } else if (mos < 4) {
            return { background: COLOR.yellowlighter, color: COLOR.darkgrey };
        }
        return { background: COLOR.greenlighter, color: COLOR.green };

    }
    private getCurrentMapping(): Array<any> {
        return [
            {
                name: 'Any',
                value: 0,
                color: 'grey'
            },
            {
                name: 'Init',
                value: 1,
                color: '#CC1900'
            },
            {
                name: 'Unauthorized',
                value: 2,
                color: '#FF3332'
            },
            {
                name: 'Progress',
                value: 3,
                color: '#B8F2FF'
            },
            {
                name: 'Ringing',
                value: 4,
                color: '#B8F2FF'
            },
            {
                name: 'Connected',
                value: 5,
                color: '#44c51a'
            },
            {
                name: 'Moved',
                value: 6,
                color: '#D7CAFA'
            },
            {
                name: 'Busy',
                value: 7,
                color: '#FFF6BA'
            },
            {
                name: 'User Failure',
                value: 8,
                color: '#F41EC7'
            },
            {
                name: 'Hard Failure',
                value: 9,
                color: '#F41EC7'
            },
            {
                name: 'Finished',
                value: 10,
                color: '#4bca24'
            },
            {
                name: 'Canceled',
                value: 11,
                color: '#FFF6BA'
            },
            {
                name: 'Timed Out',
                value: 12,
                color: '#FF7F7E'
            },
            {
                name: 'Bad Termination',
                value: 13,
                color: '#FF7F7E'
            },
            {
                name: 'Declined',
                value: 14,
                color: '#F41EC7'
            },
            {
                name: 'Unknown',
                value: 15,
                color: '#F41EC7'
            }
        ];
    }

    private getStatusByMapping(status: number): string {
        this.currentMapping = this.mappingService.getCurrentMapping();
        const mappings = this.currentMapping || this.getCurrentMapping();
        if (mappings) { return (mappings.find((f: any) => f.value === status))?.name; }

        return 'Null';
    }

    private getColorByMapping(status: number): any {
        this.currentMapping = this.mappingService.getCurrentMapping();
        const mappings = this.currentMapping || this.getCurrentMapping();
        if (mappings) { return ((mappings.find((f: any) => f.value === status))?.color + '55') || Functions.colorsByStatus(status); }
    }

    findTaskData(task: any, type: any): any {
        return task?.find((f: any) => f.title === type) || { body: '' };
    }
    secFormatter(s: number): string {
        return moment.utc(s * 1000).format('HH:mm:ss');
    }

    floatToInt(f: number): number {
        return Math.round(f);
    }



    onCopyCall(evt, call) {
        evt.stopPropagation();
        const callHeader = document.getElementById(call);

        let notification = ''
        this.translateService.get('notifications.success.callidCopy', { callid: call }).subscribe(res => {
            notification = res;
        })
        this.copyService.copy(call, notification);
    }

    showTooltip(item: any) {
        this.tooltipService.show(item);
        this.cdr.detectChanges();
    }

    hideTooltip() {
        this.tooltipService.hide();
        this.cdr.detectChanges();
    }
}
