import { Injectable } from '@angular/core';
import { WorkerCommands } from '@app/models/worker-commands.module';

export enum WorkerScript {
  TRANSACTION = '@app/workers/transaction.worker',
  CLICKHOUSE = '@app/workers/clickhouse.worker'
}
interface WorkerPull {
  [key: string]: WorkerService;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  static workerPull: WorkerPull = {};

  worker: Worker;
  instanceId: number;

  static async doOnce(workerCommand: WorkerCommands, data: any, path: string = WorkerScript.TRANSACTION, id: string = '1') {
    const workerId = path === WorkerScript.CLICKHOUSE ? `${workerCommand}_${id}` : workerCommand;
    if (!WorkerService.workerPull[workerCommand]) {
      if (path === WorkerScript.TRANSACTION) {
        WorkerService.workerPull[workerId] = new WorkerService(new Worker(new URL('@app/workers/transaction.worker', import.meta.url), { type: 'module' }));
      } else if (path === WorkerScript.CLICKHOUSE) {
        WorkerService.workerPull[workerId] = new WorkerService(new Worker(new URL('@app/workers/clickhouse.worker', import.meta.url), { type: 'module' }));
      }
      console.log(WorkerService.workerPull[workerId]);
    }
    return await WorkerService.workerPull[workerId].do(workerCommand, data);
  }

  constructor(worker: Worker) {
    this.worker = worker;
    this.instanceId = Math.floor(Math.random() * 999);
  }
  public getParseData(metaData, srcdata): Promise<any> {
    return new Promise(resolve => {
      this.worker.onmessage = ({ data }) => resolve(JSON.parse(data));
      this.worker.postMessage(JSON.stringify({ metaData, srcdata }));
    });
  }

  public async do(workerCommand: WorkerCommands, data: any) {
    return await this.getParseData({ workerCommand }, data);
  }
  public terminate() {
    this.worker.terminate();
  }
}
