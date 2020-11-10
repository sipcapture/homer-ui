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
        return new Promise((resolve, reject) => {
            const t = performance.now();

            this.worker.onmessage = ({ data }) => {
                // try {
                // console.log('worker.onmessage::start::resolve(JSON.parse(data))', t);
                resolve(JSON.parse(data));
                console.log('(END) worker.onmessage::start::resolve(JSON.parse(data))', performance.now() - t, 'ms');
                // } catch (err) {
                //     console.error('worker.onmessage::', err);
                //     reject(err);
                // }
            };
            console.log('set data into worker', t);
            this.worker.postMessage(JSON.stringify({ metaData, srcdata }));
            console.log('(END) set data into worker', performance.now() - t, 'ms');
        });
    }

}
