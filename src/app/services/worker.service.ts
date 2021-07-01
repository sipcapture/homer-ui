import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WorkerService {
    worker: Worker;
    constructor(worker: Worker) {
        this.worker = worker;
    }

    public getParseData(metaData, srcdata): Promise<any> {
        return new Promise(resolve => {
            this.worker.onmessage = ({ data }) => resolve(JSON.parse(data));
            this.worker.postMessage(JSON.stringify({ metaData, srcdata }));
        });
    }
}
