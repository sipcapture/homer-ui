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
    transactionProfile: any;
    UAC = '';
    F = Functions;
    objectKeys = Object.keys;
    public pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
    };
    toggleStatus;
    public pieChartType = 'doughnut';
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

        for (const callid in this.callDataByCallid) {

            if (this.callDataByCallid.hasOwnProperty(callid)) {

                let profile = '';
                if (this.callDataByCallid[callid][0]) {
                    profile = this.callDataByCallid[callid][0].profile;
                }

                if (profile === '1_call') {

                    this.transactionProfile = 'call';
                    const messages = this.callDataByCallid[callid];

                    const trans = {
                        SessionRequestDelay: 0,
                        SuccessfulSessionSetupDelay: 0,
                        FailedSessionSetupDelay: 0,
                        SessionDisconnectDelay: 0,
                        SessionDurationTime: 0,
                        SuccessfulSessionDurationSDT: 0,
                        FirstMessage: 0,
                        LastMessage: 0,
                        CdrStartTime: 0,
                        CdrStopTime: 0,
                        CdrConnectTime: 0,
                        CdrRingingTime: 0,
                        RingingTime: 0,
                        Duration: 0,
                        Status: 0,
                        LastBadReply: 0,
                        UAC: 'Unknown',
                        UAS: 'Unknown',
                        timeInvite: 0,
                        timeTrying: 0,
                        timeRinging: 0,
                        timeConnect: 0,
                        timeCancel: 0,
                        timeBye: 0,
                        methods: {},
                        chart:{},
                        destination_ip: '127.0.0.1',
                        source_ip: '127.0.0.1',
                        destination_port: 0,
                        source_port: 0,
                        from_user: '',
                        to_user: '',
                        from_domain: '',
                        from_tag:'',
                        ruri_domain: '',
                        ruri_user: '',
                        callid: callid,
                        task: []
                    };

                    const regexpCseq = new RegExp('CSeq:(.*) (INVITE|BYE|CANCEL|UPDATE|PRACK)', 'g');

                    messages.forEach((message) => {
                        const reply = parseInt(message.method, 10);
                        const messageTime = Math.round((message.timeSeconds * 1000000 + message.timeUseconds) / 1000);
                        if (!trans.methods[message.method]) {
                            trans.methods[message.method] = 0;
                        }
                        if(message.method){
                            trans.methods[message.method]++;
                        }
                        
                        if (trans.FirstMessage == 0 || trans.FirstMessage > messageTime) {
                            trans.FirstMessage = messageTime;
                        }

                        if (trans.LastMessage < messageTime) {
                            trans.LastMessage = messageTime;
                        }

                        trans.SessionDurationTime = trans.LastMessage - trans.FirstMessage;

                        if (message.method === 'INVITE' && trans.timeInvite === 0) {
                            trans.timeInvite = messageTime;
                            trans.CdrStartTime = trans.timeInvite;
                            if (message.user_agent !== '') {
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
                        } else if (message.method === 'BYE' && trans.timeBye === 0) {
                            trans.timeBye = messageTime;
                            trans.CdrStopTime = trans.timeBye;
                            trans.Status = 10;

                            if (trans.CdrConnectTime !== 0 && trans.CdrConnectTime < trans.CdrStopTime) {
                                trans.SuccessfulSessionDurationSDT = trans.CdrStopTime - trans.CdrStartTime;
                                trans.Duration = Math.round((trans.CdrStopTime - trans.CdrConnectTime) / 1000);
                            }

                            /* woraround if UAC sends BYE and not CANCEL */
                            if (trans.CdrRingingTime !== 0 && trans.RingingTime == 0
                                && trans.CdrRingingTime < trans.CdrStopTime) {
                                trans.RingingTime = trans.CdrStopTime - trans.CdrRingingTime;
                            }

                        } else if (message.method === 'CANCEL' && trans.timeCancel === 0) {
                            trans.timeCancel = messageTime;
                            trans.CdrStopTime = trans.timeCancel;
                            /* UAC sends CANCEL - stop it */
                            if (trans.CdrRingingTime !== 0 && trans.RingingTime == 0
                                && trans.CdrRingingTime < trans.CdrStopTime) {
                                trans.RingingTime = trans.CdrStopTime - trans.CdrRingingTime;
                            }

                            trans.Status = 11;
                        } else if (reply >= 100 && reply < 700) {

                            let cSeqMethod = 'UNKNOWN';
                            const cRes = message.raw.match(regexpCseq);
                            if (cRes && cRes.length > 0) {
                                const dataCseq = cRes[0].split(' ');
                                if (dataCseq[2] && dataCseq[2] !== '') {
                                    cSeqMethod = dataCseq[2];
                                }
                            }

                            if (trans.SessionRequestDelay === 0 && trans.timeInvite !== 0) {
                                trans.SessionRequestDelay = messageTime - trans.timeInvite;
                            }

                            if (reply > 100 && reply < 200 && trans.SuccessfulSessionSetupDelay === 0) {
                                trans.SuccessfulSessionSetupDelay = messageTime - trans.timeInvite;
                                if (message.user_agent !== '') {
                                    trans.UAS = message.user_agent;
                                }
                            }

                            if (reply === 183 && trans.CdrRingingTime === 0) {
                                trans.Status = 3;
                                trans.CdrRingingTime = messageTime;
                            }
                            else if (reply === 180 && (trans.CdrRingingTime === 0 || trans.Status == 3)) {
                                trans.CdrRingingTime = messageTime;
                                trans.Status = 4;
                            }
                            else if (reply === 200 && trans.CdrConnectTime === 0 && cSeqMethod === 'INVITE') {
                                trans.CdrConnectTime = messageTime;
                                // reset if we have seen MOVE
                                trans.CdrStopTime = 0;
                                trans.Status = 5;
                                if (trans.CdrRingingTime !== 0 && trans.RingingTime == 0
                                    && trans.CdrRingingTime < trans.CdrConnectTime) {
                                    trans.RingingTime = trans.CdrConnectTime - trans.CdrRingingTime;
                                }
                                if (message.user_agent !== '') {
                                    trans.UAS = message.user_agent;
                                }
                            }
                            else if (reply > 400 && reply < 700 && reply !== 401 && reply !== 402 && reply !== 407 && reply !== 487
                                && trans.FailedSessionSetupDelay === 0 && cSeqMethod === 'INVITE') {

                                if (reply === 486) {
                                    trans.Status = 7;
                                } else if (reply === 480) {
                                    trans.Status = 12;
                                } else if (reply / 100 === 4) {
                                    trans.Status = 8;
                                } else if (reply / 100 === 5) {
                                    trans.Status = 9;
                                } else if (reply / 100 === 6) {
                                    trans.Status = 14;
                                }

                                trans.CdrStopTime = messageTime;
                                if (messageTime > trans.CdrStartTime) {
                                    trans.FailedSessionSetupDelay = messageTime - trans.CdrStartTime;
                                }

                                /* UAS sends 4XX - 6XX - stop ringing */
                                if (trans.CdrRingingTime !== 0 && trans.RingingTime == 0
                                    && trans.CdrRingingTime < trans.CdrStopTime) {
                                    trans.RingingTime = trans.CdrStopTime - trans.CdrRingingTime;
                                }
                            }

                            if (reply === 401 || reply === 407 && cSeqMethod === 'INVITE') {
                                trans.Status = 2;
                            }

                            if (reply > 300 && reply < 400 && cSeqMethod === 'INVITE') {
                                trans.Status = 6;
                                trans.CdrStopTime = messageTime;

                                if (trans.CdrRingingTime !== 0 && trans.RingingTime == 0
                                    && trans.CdrRingingTime < trans.CdrStopTime) {
                                    trans.RingingTime = trans.CdrStopTime - trans.CdrRingingTime;
                                }
                            }

                            if (reply > 400 && reply < 700) {
                                trans.LastBadReply = reply;
                            }

                            if (reply === 200 && trans.SessionDisconnectDelay === 0 && cSeqMethod === 'BYE') {
                                if (trans.timeBye !== 0 && trans.timeBye < messageTime) {
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
                        const mKeys = Object.keys(trans.methods);
                        const mValues = mKeys.map(function (v) { return trans.methods[v]; });
                        trans.chart = {
                            type: TASK_TYPE.chart,
                            title: 'Methods',
                            color: COLOR.grey,
                            data: trans.methods,
                            /** body is chart data */
                            label: mKeys,
                            value: mValues
                        };
                    }


                    if (trans['RingingTime'] && trans['RingingTime'] > 0) {

                        const val = (trans['RingingTime'] / 1000).toFixed(2);

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
                        color: COLOR.redlighter,
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

                    trans['ua_src'] = {
                        title: 'UAC',
                        color: COLOR.yellow,
                        type: TASK_TYPE.number,
                        body: trans['UAC'],
                        prefix: '',
                    };

                    trans['ua_dst'] = {
                        title: 'UAS',
                        color: COLOR.yellow,
                        type: TASK_TYPE.number,
                        body: trans['UAS'],
                        prefix: '',
                    };

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
                        const val = (trans['SessionDurationTime'] / 1000).toFixed(2);

                        trans.task.push({
                            title: 'Session Duration Time',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'sec',
                        });
                    }

                    this.callTransaction.push(trans);
                }

                if (profile === '1_registration') {

                    this.transactionProfile = 'registration';

                    const messages = this.callDataByCallid[callid];
                    const trans = {
                        RegistrationRequestDelay: 0,
                        FailedRegistrationRequestDelay: 0,
                        FirstMessage: 0,
                        CdrStartTime: 0,
                        CdrFinishTime: 0,
                        CdrFailedTime: 0,
                        Duration: 0,
                        Status: 0,
                        LastBadReply: 0,
                        UAC: 'Unknown',
                        UAS: 'Unknown',
                        timeRegister: 0,
                        timeFailed: 0,
                        timeFinish: 0,
                        chart: {},
                        methods: {},
                        destination_ip: '127.0.0.1',
                        source_ip: '127.0.0.1',
                        destination_port: 0,
                        source_port: 0,
                        from_user: '',
                        to_user: '',
                        from_domain: '',
                        ruri_domain: '',
                        ruri_user: '',
                        callid: callid,
                        task: []
                    };

                    messages.forEach((message) => {

                        const reply = parseInt(message.method, 10);
                        const messageTime = Math.round((message.timeSeconds * 1000000 + message.timeUseconds) / 1000);

                        if (!trans.methods[message.method]) {
                            trans.methods[message.method] = 0;
                        }

                        trans.methods[message.method]++;

                        if (trans.FirstMessage === 0) {
                            trans.FirstMessage = messageTime;
                        }

                        if (message.method === 'REGISTER' && trans.timeRegister === 0) {
                            trans.timeRegister = messageTime;
                            trans.CdrStartTime = trans.timeRegister;
                            if (message.user_agent !== '') {
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
                        } else if (reply >= 100 && reply < 700) {

                            if (reply > 100 && reply < 200) {
                                if (message.user_agent !== '') {
                                    trans.UAS = message.user_agent;
                                }
                            }

                            if (reply === 200) {

                                if (trans.CdrFinishTime === 0) {
                                    trans.CdrFinishTime = messageTime;
                                    trans.RegistrationRequestDelay = messageTime - trans.timeRegister;
                                    trans.Duration = trans.RegistrationRequestDelay;
                                }

                                // reset if we seen MOVE
                                trans.Status = 3;
                                if (message.user_agent !== '') {
                                    trans.UAS = message.user_agent;
                                }
                            }



                            if (reply > 400 && reply < 700 && reply !== 401 && reply !== 407 && reply !== 487
                                && trans.FailedRegistrationRequestDelay === 0) {

                                if (reply === 480) {
                                    trans.Status = 6;
                                } else if (reply / 100 === 4) {
                                    trans.Status = 7;
                                } else if (reply / 100 === 5) {
                                    trans.Status = 8;
                                } else if (reply / 100 === 6) {
                                    trans.Status = 8;
                                }

                                trans.CdrFailedTime = messageTime;
                                if (messageTime > trans.CdrStartTime) {
                                    trans.FailedRegistrationRequestDelay = messageTime - trans.CdrStartTime;
                                    trans.Duration = trans.FailedRegistrationRequestDelay;
                                }
                            }

                            if (reply === 401 || reply === 407) {
                                trans.Status = 2;
                            }

                            if (reply > 400 && reply < 700) {
                                trans.LastBadReply = reply;
                            }
                        }
                    });

                    /** tasks for each CallId */

                    /* messages array */
                    if (Object.keys(trans.methods).length > 0) {
                        /* chart of messages */
                        const mKeys = Object.keys(trans.methods);
                        const mValues = mKeys.map(function (v) { return trans.methods[v]; });
                        trans.chart = {
                            type: TASK_TYPE.chart,
                            title: 'Methods',
                            color: COLOR.grey,
                            data: trans.methods,
                            /** body is chart data */
                            label: mKeys,
                            value: mValues
                        };
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
                        color: COLOR.redlighter,
                        type: TASK_TYPE.number,
                        body: trans['LastBadReply'],
                        prefix: '',
                    });

                    trans.task.push({
                        title: 'Status',
                        color:
                            Functions.getColorRegistrationByStatus(trans['Status']) ||
                            COLOR.grey,
                        type: TASK_TYPE.number,
                        abs: trans['Status'],
                        body: this.getNameRegistrationByStatus(trans['Status']),
                        prefix: '',
                    });

                    trans['ua_src'] = {
                        title: 'UAC',
                        color: COLOR.yellow,
                        type: TASK_TYPE.number,
                        body: trans['UAC'],
                        prefix: '',
                    };

                    trans['ua_dst'] = {
                        title: 'UAS',
                        color: COLOR.yellow,
                        type: TASK_TYPE.number,
                        body: trans['UAS'],
                        prefix: '',
                    };

                    /* metrics */
                    if (trans['RegistrationRequestDelay'] > 0) {
                        const val = trans['RegistrationRequestDelay'];
                        trans.task.push({
                            title: 'Registration Request Delay',
                            color: COLOR.grey,
                            type: TASK_TYPE.stats,
                            body: val,
                            prefix: 'ms',
                        });
                    }

                    /* metrics */
                    if (trans['FailedRegistrationRequestDelay'] > 0) {
                        const val = trans['FailedRegistrationRequestDelay'];
                        trans.task.push({
                            title: 'Failed Registration Request Delay',
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


    private getNameRegistrationByStatus(status: number) {
        if (status === 1) {
            return 'Init';
        } else if (status === 2) {
            return 'Unauthorized';
        } else if (status === 3) {
            return 'Registered';
        } else if (status === 4) {
            return 'Moved';
        } else if (status === 5) {
            return 'Blocked';
        } else if (status === 6) {
            return 'Timeout Terminated';
        } else if (status === 7) {
            return 'Soft Terminated';
        } else if (status === 8) {
            return 'Hard Terminated';
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
