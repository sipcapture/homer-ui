import { AgentsubService } from '@app/services/agentsub.service';
import { Injectable } from '@angular/core';
import { CallReportService } from './report.service';
import { CallTransactionService } from './transaction.service';
import { Observable } from 'rxjs';
import { HepLogService } from './hep-log.service';
import { WorkerService } from '../worker.service';
import { WorkerCommands } from '../../models/worker-commands.module';
import { log, Functions } from '@app/helpers/functions';
import { PreferenceHepsubService } from '../preferences';
import { PreferenceAgentsubService } from '@app/services';
import { DateTimeRangeService } from '@services/data-time-range.service';
@Injectable({
  providedIn: 'root'
})
export class FullTransactionService {
  isReadyAfterCollectData = false;
  constructor(
    private callReportService: CallReportService,
    private callTransactionService: CallTransactionService,
    private hepLogService: HepLogService,
    private agentsubService: AgentsubService,
    private preferenceHepsubService: PreferenceHepsubService,
    private _pass: PreferenceAgentsubService,
    private dateTimeRangeService: DateTimeRangeService

  ) { }

  public getTransactionData(requestTransaction, dateFormat): Observable<any> {
    const _worker = async data => await WorkerService.doOnce(WorkerCommands.TRANSACTION_SERVICE_FULL, data);
    return new Observable<any>(observer => {
      let tData;
      const next = type => observer.next({ type, data: tData });
      let tr = false, dt = false, qo = false, lo = false, rc = false;
      const ready = (type, fn = null) => {
        // console.log('ready', type)
        if (this.isReadyAfterCollectData) {
          tr = tr || type === 'transaction';
          dt = dt || type === 'dtmf';
          qo = qo || type === 'qos';
          lo = lo || type === 'heplogs';

          if (tr && dt && qo && lo) {
            next('transaction');
          }
        } else {
          next(type);
        }
        return fn && fn(type);
      };
      const onError = err => (type => {
        ready(type, _type => {
          log('error', _type, new Error(err));
          observer.error(err);
        });
      });
      const rt = requestTransaction;
      let typeRequest = 'cdr';
      this.callTransactionService.getTransaction(rt).toPromise().then(async (data) => {
        data.dateFormat = dateFormat;
        data.timeZone = this.dateTimeRangeService.getTimezoneForQuery();
        tData = await _worker({ tData: data, type: 'full' });
        ready('transaction');
        Object.values(rt.param.search).forEach((i: any) => i.callid = tData.callid);

        const query = Functions.cloneObject(rt);
        const [protocol] = Object.keys(query?.param?.search || {});

        const { data: hData }: any = await this.preferenceHepsubService.getAll().toPromise();
        const { mapping } = hData.find(({ hepid, profile }) => `${hepid}_${profile}` === protocol) || {};

        const { messages, calldata } = tData?.data || {};

        // source_field - string (HEPSUB mapping contains single lookup property source_field)
        const { source_field } = mapping || {};
        if (source_field) {
          const [, fName] = source_field.split('.');
          query.param.search[protocol][fName] = [...messages, ...calldata]
            .filter(i => i[fName])
            .map(i => i[fName]).sort()
            .filter((i, k, a) => i !== a[k + 1]);
        }
        // source_fields - object (HEPSUB mapping contains multiple lookup properties source_fields)
        const { source_fields } = mapping || {};
        if (source_fields) {
          Object.entries(source_fields).forEach(([key, value]: any) => {
            const [, fName] = value.split('.');
            query.param.search[protocol][key] = [...messages, ...calldata]
              .filter(i => i[fName])
              .map(i => i[fName]).sort()
              .filter((i, k, a) => i !== a[k + 1]);
          })
        }

        try {
          // load all subscribed agents
          const agents: any = await this._pass.getAll().toPromise();
          // load all HEPSUB mappings (but why?!)
          const hsData: any = await this.preferenceHepsubService.getAll().toPromise();
          if (agents && agents.data) {
            if (hsData) {
              agents.data.some(agent => {
                /** if exist an agent on hepsub list */
                typeRequest = agent.type;

                // console.log({ mapping, protocol, query, agentSubList, hData, source_field, tData });

                // perform sync lookup of the type data against each subscriber
                let getAgentCustomType: any = this.agentsubService.getHepsubElements({ uuid: agent.uuid, type: agent.type, data: query });
                // todo consider additional checks that confirm we have the data, initially expect the server to return 404 when not found
                if (getAgentCustomType.status == 200 && getAgentCustomType.data) {
                  tData.agentCdr = getAgentCustomType;
                  return true; // halt iteration on first match
                }
                // try next agent/subscriber
                return false;
              });
            }
          }
        } catch (err) { onError('agentCdr'); }

        try {
          const hepLogRes: any = await this.hepLogService.getLog(rt).toPromise();
          tData = await _worker({ tData, logsData: hepLogRes.data, type: 'logs' });
          tData.heplogs = hepLogRes.data;
        } catch (err) { onError('heplogs'); }


        try {
          const callIdArr = tData?.data?.calldata.map(i => i.sid).sort().filter((i, k, a) => i !== a[k - 1]) || [];
          Object.values(rt.param.search).forEach((i: any) => i.callid = callIdArr);
          const qosData: any = await this.callReportService.postQOS(rt).toPromise();
          tData = await _worker({ tData, qosData, type: 'qos' });
          tData.qosData = qosData;
        } catch (err) { onError('qos'); }
        ready('qos');


      }, onError('transaction'));
    });
  }
}
