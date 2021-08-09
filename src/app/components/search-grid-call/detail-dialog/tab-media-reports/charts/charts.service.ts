import { Injectable } from '@angular/core';

import * as moment from 'moment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Functions } from '@app/helpers/functions';
import { ChartDataSets, ChartPoint } from 'chart.js';
import { Moment } from 'moment';


export const MetricsMap = {
    mos: 'MEAN_MOS',
    jitter: 'MAX_INTERARRIVAL_JITTER',
    delta: 'DELTA',
    skew: 'MAX_SKEW',
    pl: 'CUM_PACKET_LOSS',
    packets: 'TOTAL_PK',
    bytes: 'TL_BYTE',
};
// commented code for compatibility with other libraries eg. ngx-charts
export class DataPoint implements ChartPoint {
    t?: number | string | Date | Moment;
    y?: number | string | Date | Moment;
    x?: number | string | Date | Moment;
    r?: number;
    constructor(
        t: number | string | Date | Moment = new Date(),
        y: number | string | Date | Moment = 0,
        x?: number | string | Date | Moment,
        r?: number,
    ) {
        this.t = t;
        this.y = y;
        (x) ? this.x = x : null;
        (r) ? this.r = r : null;
    }
}

export class DataSet implements ChartDataSets {
    label: string;
    data: any[];
    ports: string[];
    uuids: any[];
    constructor(
        label: string = 'default',
        data: any[] = [new DataPoint],
        uuids: any[] = [],
        ports: string[] = []
    ) {
        this.label = label;
        this.data = data;
        this.uuids = uuids;
        this.ports = ports;
    }
}

export class DataSets extends Array<DataSet> { }

@Injectable({
    providedIn: 'root'
})
export class ChartsService {
    private legendSubject = new BehaviorSubject<any>({});
    private chartSubject = new BehaviorSubject<any>({});
    private legendStorageSubject = new BehaviorSubject<any>([]);

    private setupColorChartItem(labelForColor, type): any {
        const color = Functions.getColorByString;
        return {
            backgroundColor: color(labelForColor, 50, 50, type === 'bar' ? 1 : 0.4),
            hoverBackgroundColor: color(labelForColor, 50, 50),
            borderColor: color(labelForColor, 50, 50),
            pointBackgroundColor: color(labelForColor, 60, 60),
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: color(labelForColor, 60, 60, 0.8),
        };
    }
    public groupBy(arr: any[], key: string) {
        return arr.reduce((rv, x) => {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, []);
    }

    public getChartData(transactions: any[], metric = 'mos', template: any = {}, type = '', legendItems: string[] = null): any {
        let metricsMap;
        const time = ({ create_ts }) => moment(create_ts).format('HH:mm:ss');
        const labels = transactions
            .filter(({ source_ip, source_port }) => !legendItems || legendItems.includes(source_ip + ':' + source_port))
            .map(time)
            .filter((i, k, a) => i !== a[k - 1]);
        const datasets: DataSets = [];
        const aliases: string[] = [];

        const groupedTransactions = Object.values(this.groupBy(transactions, 'create_ts'))
            .map((item: any[]) => item.find(k => Math.min(...item.map(i => i.MOS)) === k.MOS));

        groupedTransactions.forEach(({ message, id, source_ip, source_port, create_ts }) => {
            const label: string = source_ip + ':' + source_port;
            if (legendItems && !legendItems.includes(label)) {
                return;
            }
            // exception for JITTER
            if (metric === 'jitter') {
                metricsMap = message.SOURCE === 'RTCP' ? 'MAX_INTERARRIVAL_JITTER' : 'MAX_JITTER';
            } else {
                metricsMap = MetricsMap[(metric as string)];
            }
            let dataPoint;
            if (metric === 'pl') {
                dataPoint = message[metricsMap] || message['PACKET_LOSS'];
            } else {
                dataPoint = message[metricsMap];
            }
            const uuidPoint = id || 0;

            const dataTimeIndex = labels.indexOf(time({ create_ts }));

            if (aliases.includes(label)) {
                const trnsIndex = datasets.findIndex(dts => dts.label === label);
                datasets[trnsIndex].data[dataTimeIndex] = dataPoint;
                datasets[trnsIndex].uuids[dataTimeIndex] = uuidPoint;
            } else {
                aliases.push(label);
                const data = [];
                const uuids = [];
                const labelForColor = label + ' ' + Functions.md5(label);
                const trnsColors: any = this.setupColorChartItem(labelForColor, type);
                data[dataTimeIndex] = dataPoint;
                uuids[dataTimeIndex] = uuidPoint;
                datasets.push({ label, data, uuids, ...trnsColors, ...template });
            }
        });
        return {
            labels, datasets
        };
    }

    public getLegendValue() {
        return this.legendStorageSubject.getValue();
    }
    public get getLegend(): Observable<any> {
        return this.legendSubject.asObservable();
    }
    public generateLegend(legendItems) {
        this.legendSubject.next(legendItems);
    }
    public get getHiddenDataset(): Observable<any> {
        return this.chartSubject.asObservable();
    }
    public hideDataset(legendID) {
        this.chartSubject.next(legendID);
    }
    public get retrieveLegend(): Observable<any> {
        return this.legendStorageSubject.asObservable();
    }
    public storeLegend(legend) {
        this.legendStorageSubject.next(legend);
    }
}
