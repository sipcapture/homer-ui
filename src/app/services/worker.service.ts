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
                // try {
                const t = performance.now();
                console.log('worker.onmessage::start::resolve(JSON.parse(data))', t);
                resolve(JSON.parse(data));
                console.log('(END) worker.onmessage::start::resolve(JSON.parse(data))', performance.now() - t, 'ms');
                // } catch (err) {
                //     console.error('worker.onmessage::', err);
                //     reject(err);
                // }
            };
            const t = performance.now()
            console.log('set data into worker', t);
            this.worker.postMessage(JSON.stringify({ metedata, srcdata }));
            console.log('(END) set data into worker', performance.now() - t, 'ms');
        });
    }

}
