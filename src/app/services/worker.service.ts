import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WorkerService {
    worker: Worker;
    constructor(worker: Worker) {
        this.worker = worker;
    }

    public getParseData(metedata, srcdata): Promise<any> {
        return new Promise((resolve, reject) => {
            this.worker.onmessage = ({ data }) => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    console.error('worker.onmessage::', err);
                    reject(err);
                }
            };

            this.worker.postMessage(JSON.stringify({ metedata, srcdata }));
        });
    }

}
