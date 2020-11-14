import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Functions } from '../../../../helpers/functions';
import * as moment from 'moment';


enum COLOR {
    green = '#dcf7dc',
    greenlighter = '#9ffc9f',
    orange = '#ffcf78',
    orangelighter = '#f7b53e',
    yellow = '#fff2cc',
    yellowlighter = '#f5eb62',
    red = '#f4cccc',
    redlighter = '#fc8460',
    grey = '#eeeeee',
    greylighter = '#bab8b8',
    bluelighter = '#ccdef2',
    corporate = '#e3ecfa',
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
@Component({
    selector: 'app-tab-callinfo',
    templateUrl: './tab-callinfo.component.html',
    styleUrls: ['./tab-callinfo.component.scss'],
})
export class TabCallinfoComponent {
    hostinfo: any;
    ipAlias: Array<any> = [];
    callTransaction: Array<any> = [];
    callDataByCallid: Array<any> = [];
    rtpagentReports: any = {};
    UAC = '';
    F = Functions;
    objectKeys = Object.keys;
    public pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
    };
    toggleStatus;
    public pieChartType = 'pie';
    @Input() set dataItem(_dataItem) {
        const clone = Functions.cloneObject;

        const CallReportDataByCallid = clone(
            _dataItem.data.messages
                .reduce((acc, k) => (acc[k.sid] = [...(acc[k.sid] || []), k], acc), {})
        );

        this.initSession(
            CallReportDataByCallid
        );

    }

    private initSession(dataByCallid) {
        this.callDataByCallid = dataByCallid || [];
        this.callTransaction = [];

        for (var callid in this.callDataByCallid) {

            if (this.callDataByCallid.hasOwnProperty(callid)) {

                if (this.callDataByCallid[callid].profile = "1_call") {

                    const messages = this.callDataByCallid[callid];
                    const trans = {
                        SessionRequestDelay: 0,
                        SuccessfulSessionSetupDelay: 0,
                        FailedSessionSetupDelay: 0,
                        SessionDisconnectDelay: 0,
                        SessionDurationTime: 0,
                        SuccessfulSessionDurationSDT: 0,
                        FirstMessage: 0,
                        CdrStartTime: 0,
                        CdrStopTime: 0,
                        CdrConnectTime: 0,
                        CdrRingingTime: 0,
                        RingingTime: 0,
                        Duration: 0,
                        Status: 0,
                        LastBadReply: 0,
                        UAC: "",
                        UAS: "",
                        timeInvite: 0,
                        timeTrying: 0,
                        timeRinging: 0,
                        timeConnect: 0,
                        timeCancel: 0,
                        timeBye: 0,
                        methods: {},
                        destination_ip: "127.0.0.1",
                        source_ip: "127.0.0.1",
                        destination_port: 0,
                        source_port: 0,
                        from_user: "",
                        to_user: "",
                        from_domain: "",
                        ruri_domain: "",
                        ruri_user: "",
                        callid: callid,
                        task: []
                    }

                    var regexpCseq = new RegExp('CSeq:(.*) (INVITE|BYE|CANCEL|UPDATE)', 'g');

                    messages.forEach((message) => {

                        var reply = parseInt(message.method);
                        var messageTime = (message.timeSeconds * 1000000 + message.timeUseconds) / 1000;

                        if (!trans.methods[message.method]) {
                            trans.methods[message.method] = 0;
                        }

                        trans.methods[message.method]++;

                        if (trans.FirstMessage == 0) {
                            trans.FirstMessage = messageTime;
                        }

                        trans.SessionDurationTime = messageTime - trans.FirstMessage;

                        if (message.method == "INVITE" && trans.timeInvite == 0) {
                            trans.timeInvite = messageTime;
                            trans.CdrStartTime = trans.timeInvite;
                            if (message.user_agent != "") {
                                trans.UAC = message.user_agent;
                            }
                            trans.from_user = message.from_user;
                            trans.ruri_user = message.ruri_user;
                            trans.to_user = message.to_user;
                            trans.source_ip = message.srcIp;
                            trans.source_port = message.srcPort;
                            trans.destination_port = message.dstPort;
                            trans.destination_ip = message.dstIp;
                            trans.from_domain = message.from_domain;
                            trans.ruri_domain = message.ruri_domain;

                            trans.Status = 1;
                        } else if (message.method == "BYE" && trans.timeBye == 0) {
                            trans.timeBye = messageTime;
                            trans.CdrStopTime = trans.timeBye;
                            trans.Status = 10;

                            if (trans.CdrConnectTime != 0 && trans.CdrConnectTime < trans.CdrStopTime) {
                                trans.SuccessfulSessionDurationSDT = trans.CdrStopTime - trans.CdrStartTime;
                                trans.Duration = trans.SessionDurationTime / 1000;
                            }

                        } else if (message.method == "CANCEL" && trans.timeCancel == 0) {
                            trans.timeCancel = messageTime;
                            trans.CdrStopTime = trans.timeCancel;
                            trans.Status = 11;
                        } else if (reply >= 100 && reply < 700) {

                            var cSeqMethod = "UNKNOWN";
                            var cRes = message.raw.match(regexpCseq);
                            if (cRes.length > 0) {
                                var dataCseq = cRes[0].split(" ");
                                if (dataCseq[2] && dataCseq[2] != "") {
                                    cSeqMethod = dataCseq[2];
                                }
                            }
                            if (trans.SessionRequestDelay == 0 && trans.timeInvite != 0) {
                                trans.SessionRequestDelay = trans.timeInvite - messageTime;
                            }

                            if (reply > 100 && reply < 200 && trans.SuccessfulSessionSetupDelay == 0) {
                                trans.SuccessfulSessionSetupDelay = trans.timeInvite - messageTime;
                                if (message.user_agent != "") {
                                    trans.UAS = message.user_agent;
                                }
                            }

                            if (reply == 183) {
                                trans.Status = 3;
                            }

                            if (reply == 180 && trans.CdrRingingTime == 0) {
                                trans.CdrRingingTime = messageTime;
                                trans.Status = 4;
                            }

                            if (reply == 200 && trans.CdrConnectTime == 0 && cSeqMethod == "INVITE") {
                                trans.CdrConnectTime = messageTime;
                                //reset if we seen MOVE
                                trans.CdrStopTime = 0;
                                trans.Status = 5;
                                if (trans.CdrRingingTime != 0 && trans.CdrRingingTime < trans.CdrConnectTime) {
                                    trans.RingingTime = trans.CdrConnectTime - trans.CdrRingingTime;
                                }
                                if (message.user_agent != "") {
                                    trans.UAS = message.user_agent;
                                }
                            }

                            if (reply > 400 && reply < 700 && reply != 401 && reply != 402 && reply != 407 && reply != 487
                                && trans.FailedSessionSetupDelay == 0 && cSeqMethod == "INVITE") {

                                if (reply == 486) {
                                    trans.Status = 7;
                                }
                                else if (reply == 480) {
                                    trans.Status = 12;
                                }
                                else if (reply / 100 == 4) {
                                    trans.Status = 8;
                                }
                                else if (reply / 100 == 5) {
                                    trans.Status = 9;
                                }
                                else if (reply / 100 == 6) {
                                    trans.Status = 14;
                                }

                                trans.CdrStopTime = messageTime;
                                if (messageTime > trans.CdrStartTime) {
                                    trans.FailedSessionSetupDelay = messageTime - trans.CdrStartTime;
                                }
                            }

                            if (reply == 401 || reply == 407 && cSeqMethod == "INVITE") {
                                trans.Status = 2;
                            }

                            if (reply > 300 && reply < 400 && cSeqMethod == "INVITE") {
                                trans.Status = 6;
                                trans.CdrStopTime = messageTime;
                            }

                            if (reply > 400 && reply < 700) {
                                trans.LastBadReply = reply;
                            }

                            if (reply == 200 && trans.SessionDisconnectDelay == 0 && cSeqMethod == "BYE") {
                                if (trans.timeBye != 0 && trans.timeBye < messageTime) {
                                    trans.SessionDisconnectDelay = messageTime - trans.timeBye;
                                }
                                trans.Status = 10;
                            }
                        }
                    });

                    /** tasks for each CallId */

                    /* messages array */
                    if (Object.keys(trans.methods).length > 0) {
                        /* chart of messages */
                        var mKeys = Object.keys(trans.methods);
                        var mValues = mKeys.map(function (v) { return trans.methods[v] });
                        trans.task.push({
                            type: TASK_TYPE.chart,
                            title: 'Methods',
                            color: COLOR.bluelighter,
                            data: trans.methods,
                            /** body is chart data */
                            label: mKeys,
                            value: mValues
                        });
                    }


                    if (trans['RingingTime'] && trans['RingingTime'] > 0) {

                        let val = ((Date.now() * 1000 - trans['RingingTime']) / 1000000).toFixed(2);

                        trans.task.push({
                            title: 'Ringing Time',
                            color: COLOR.yellow,
                            type: TASK_TYPE.number,
                            body: val,
                            prefix: 'sec',
                        });
                    }

                    trans.task.push({
                        title: 'Duration',
                        color: COLOR.orange,
                        type: TASK_TYPE.number,
                        body: this.secFormatter(trans['Duration']),
                        prefix: '',
                    });


                    trans.task.push({
                        title: 'Last Bad Reply',
                        color: COLOR.orange,
                        type: TASK_TYPE.number,
                        body: trans['LastBadReply'],
                        prefix: '',
                    });

                    trans.task.push({
                        title: 'Status',
                        color:
                            Functions.getColorByStatus(trans['Status']) ||
                            COLOR.grey,
                        type: TASK_TYPE.number,
                        abs: trans['Status'],
                        body: this.getNameByStatus(trans['Status']),
                        prefix: '',
                    });

                    if (trans['UAC'] && trans['UAC'] !== '') {
                        trans['ua_src'] = {
                            title: 'UAC',
                            color: COLOR.yellow,
                            type: TASK_TYPE.number,
                            body: trans['UAC'],
                            prefix: '',
                        };
                    }

                    if (trans['UAS'] && trans['UAS'] !== '') {
                        trans['ua_dst'] = {
                            title: 'UAS',
                            color: COLOR.yellow,
                            type: TASK_TYPE.number,
                            body: trans['UAS'],
                            prefix: '',
                        };
                    }

                    /* metrics */
                    if (trans['SessionRequestDelay'] > 0) {
                        const val = trans['SessionRequestDelay'];
                        trans.task.push({
                            title: 'Session Request Delay',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }

                    /* metrics */
                    if (trans['SuccessfulSessionSetupDelay'] > 0) {
                        const val = trans['SuccessfulSessionSetupDelay'];
                        trans.task.push({
                            title: 'Successful Session Setup',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }

                    /* metrics */
                    if (trans['FailedSessionSetupDelay'] > 0) {
                        const val = trans['FailedSessionSetupDelay'];
                        trans.task.push({
                            title: 'Failed Session Setup Delay',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }

                    /* metrics */
                    if (trans['SessionDisconnectDelay'] > 0) {
                        const val = trans['SessionDisconnectDelay'];
                        trans.task.push({
                            title: 'Session Disconnect Delay',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }
                    /* metrics */
                    if (trans['SessionDurationTime'] > 0) {
                        const val = trans['SessionDurationTime'];
                        trans.task.push({
                            title: 'Session Duration Time',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }

                    this.callTransaction.push(trans);
                }
            }
        }
    }
    public toggleCallInfo(id) {
        const div = document.getElementById(id);
        const icon = document.getElementById(id + '-icon');
        if (div.style.display === 'block') {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
        } else if (div.style.display === 'none') {
            div.style.display = 'block';
            icon.innerHTML = 'keyboard_arrow_down';
        } else {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
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
        const arLab = chartLabel.map((label) => ({
            label,
        }));
        const arVal = chartValue.map((value) => ({
            value,
        }));
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

    private getNameByStatus(status: number) {
        if (status === 1) {
            return 'Init';
        } else if (status === 2) {
            return 'Unauthorized';
        } else if (status === 3) {
            return 'Progress';
        } else if (status === 4) {
            return 'Ringing';
        } else if (status === 5) {
            return 'Connected';
        } else if (status === 6) {
            return 'Moved';
        } else if (status === 7) {
            return 'Busy';
        } else if (status === 8) {
            return 'User Failure';
        } else if (status === 9) {
            return 'Hard Failure';
        } else if (status === 10) {
            return 'Finished';
        } else if (status === 11) {
            return 'Canceled';
        } else if (status === 12) {
            return 'Timed Out';
        } else if (status === 13) {
            return 'Bad Termination';
        } else if (status === 14) {
            return 'Declined';
        } else if (status === 15) {
            return 'Unknown';
        } else {
            return 'Unknown';
        }
    }
    findTaskData(task, type): any {
        return task.find((f: any) => f.title === type) || { body: '' };
    }
    secFormatter(s) {
        return moment.utc(s * 1000).format('HH:mm:ss');
    }
    floatToInt(f) {
        return Math.round(f);
    }
}
