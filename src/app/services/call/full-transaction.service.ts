import { AgentsubService } from '@app/services/agentsub.service';
import { RecordingService } from './recording.service';
import { Injectable } from '@angular/core';
import { CallReportService } from './report.service';
import { CallTransactionService } from './transaction.service';
import { Observable } from 'rxjs';
import { HepLogService } from './hep-log.service';
import { DtmfService } from './dtmf.service';
import { WorkerService } from '../worker.service';
import { WorkerCommands } from '../../models/worker-commands.module';
import { log, Functions } from '@app/helpers/functions';
import { PreferenceHepsubService } from '../preferences';
@Injectable({
    providedIn: 'root'
})
export class FullTransactionService {
    isReadyAfterCollectData = false;
    constructor(
        private callReportService: CallReportService,
        private callTransactionService: CallTransactionService,
        private hepLogService: HepLogService,
        private dtmfService: DtmfService,
        private recordingService: RecordingService,
        private agentsubService: AgentsubService,
        private preferenceHepsubService: PreferenceHepsubService
    ) { }

    public getTransactionData(requestTransaction, dateFormat): Observable<any> {
        const _worker = async data => await WorkerService.doOnce(WorkerCommands.TRANSACTION_SERVICE_FULL, data);
        console.log({requestTransaction})
        return new Observable<any>(observer => {
            let tData;
            const next = type => observer.next({ type, data: tData });
            let tr = false, dt = false, qo = false, lo = false, rc = false;
            const ready = (type, fn = null) => {
                console.log('ready', type)
                if (this.isReadyAfterCollectData) {
                    tr = tr || type === 'transaction';
                    dt = dt || type === 'dtmf';
                    qo = qo || type === 'qos';
                    lo = lo || type === 'heplogs';
                    rc = rc || type === 'recording';

                    if (tr && dt && qo && lo) {
                        next('transaction');
                    }
                } else {
                    next(type);
                }
                return fn && fn(type);
            };
            const onError = err => (type => {
                console.log('onError', type)
                ready(type, _type => {
                    log('error', _type, new Error(err));
                    observer.error(err);
                });
            });
            const rt = requestTransaction;
            this.callTransactionService.getTransaction(rt).toPromise().then(async (data) => {
                console.log(data, tData)
                data.dateFormat = dateFormat;
                tData = await _worker({ tData: data, type: 'full' });
                ready('transaction');
                Object.values(rt.param.search).forEach((i: any) => i.callid = tData.callid);
                try {
                    const getDtmfRes: any = await this.dtmfService.getDtmf(rt).toPromise();
                    tData = await _worker({ tData, dtmfData: getDtmfRes.data, type: 'dtmf' });
                    tData.dtmf = getDtmfRes.data;
                } catch (err) { onError('dtmf'); }

                try {
                    const getRecording: any = await this.recordingService.postData(rt).toPromise();
                    tData.recording = getRecording.data;
                } catch (err) { onError('recording'); }

                try {
                    const agentSubList: any = await this.agentsubService.getAgentCdr('cdr').toPromise();
                    const { uuid, type } = agentSubList.data.find(i => i.type === 'cdr');

                    const query = Functions.cloneObject(rt);
                    const [protocol] = Object.keys(query?.param?.search || {});

                    const { data: hData }: any = await this.preferenceHepsubService.getAll().toPromise();
                    const { mapping } = hData.find(({ hepid, profile }) => `${hepid}_${profile}` === protocol) || {};

                    const { messages, calldata } = tData?.data || {};

                    // source_field - string
                    const { source_field } = mapping || {};
                    if (source_field) {
                        const [, fName] = source_field.split('.');
                        const fValue = [...messages, ...calldata]
                            .filter(i => i[fName])
                            .map(i => i[fName]).sort()
                            .filter((i, k, a) => i !== a[k + 1]);

                        query.param.search[protocol][fName] = fValue;
                    }
                    // source_fields - object
                    const { source_fields } = mapping || {};
                    if (source_fields) {
                        Object.entries(source_fields).forEach(([key, value]: any) => {
                            const [, fName] = value.split('.');
                            const fValue = [...messages, ...calldata]
                                .filter(i => i[fName])
                                .map(i => i[fName]).sort()
                                .filter((i, k, a) => i !== a[k + 1]);

                            query.param.search[protocol][key] = fValue;
                        })
                    }

                    console.log({ mapping, protocol, query, agentSubList, hData, source_field, tData });

                    const getAgentCdr: any = await this.agentsubService.getHepsubElements({ uuid, type, data: query }).toPromise();
                    tData.agentCdr = getAgentCdr;
                } catch (err) { onError('agentCdr'); }

                try {
                    const hepLogRes: any = await this.hepLogService.getLog(rt).toPromise();
                    tData = await _worker({ tData, logsData: hepLogRes.data, type: 'logs' });
                    tData.heplogs = hepLogRes.data;
                } catch (err) { onError('heplogs'); }

                try {
                    const qosData: any = await this.callReportService.postQOS(rt).toPromise();
                    tData = await _worker({ tData, qosData, type: 'qos' });
                } catch (err) { onError('qos'); }
                ready('qos');

            }, onError('transaction'));
        });
    }
}
