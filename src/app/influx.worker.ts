/// <reference lib="webworker" />

import * as moment from 'moment';

class InfluxProcessor {
    public multiDataArr = [];
    public config: any;
    public getData(data) {
        const {columns, values, name} = data.data.Results[0].Series[0];

                    let s = values.map(i => {
                        const o = {};
                        columns.forEach((j, k) => {
                            o[j] = i[k];
                        });
                        return o;
                    });

                    s = s.map(i => {
                        i.main = name;
                        return i;
                    });
                    return s;
    }
    public parseData(data) {
        return [].concat(...(Object.values(data.reduce((a, b) => {
            if (!a[b.time]) {
                a[b.time] = [];
            }
            a[b.time].push(b);
            return a;
        }, {})).map((i: any[]) => {
            return i.reduce((a, b) => {
                Object.keys(b).filter(j => j !== 'time' && j !== 'main').forEach(j => a.push({
                    attemps: 1,
                    countername: j,
                    group: 0,
                    id: 0,
                    partid: 10,
                    reporttime: new Date(b.time).getTime(),
                    table: b.main,
                    tag1: '',
                    transaction: 'statistic',
                    value: b[j]
                }));
                return a;
            }, []);
        })));
    }
    public renderingChart(inData) {
        const data = inData.data;
        let isFill;
        this.config = inData.config;
        const timeRange = inData.timeRange;
        let chartType = inData.chartType;
        const chartOptions: any = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                yAxes: [{
                    stacked: true,
                    ticks: {
                        callback: this.yAxisFormatter.bind(this),
                        beginAtZero: true
                    }
                }]
            }
        };
        let chartLabels;
        let chartData;
        let noChartData;
        data.sort((a, b) => a.reporttime - b.reporttime);
        if (chartType === 'area') {
            chartOptions.scales.yAxes[0].stacked = true;
            isFill = true;
            chartType = 'line';
        } else {
            isFill = false;
            chartOptions.scales.yAxes[0].stacked = false;
        }

        chartLabels = [];
        chartData = [];
        noChartData = data.length === 0;
        const formattedData = data.map(i => ({
            label: i.table + '.' + i.countername,
            value: i.value
        })).reduce((a, b) => {
            if (!a[b.label]) {
                a[b.label] = [];
            }
            a[b.label].push(b.value);
            return a;
        }, {});
        const timeFormat = timeRange.to - timeRange.from >= 86400 ? 'DD.MM HH:mm' : 'HH:mm';
        chartLabels = data
            .map(item => moment(item.reporttime, 'x').format(timeFormat))
            .filter((i, k, a) => i !== a[k + 1]);
        let fillKey = 0;
        Object.keys(formattedData).forEach(key => {
            const value = formattedData[key];
            chartData.push({
                fill: isFill ? ( fillKey === 0 ? 'origin' : fillKey - 1) : false,
                label: key,
                data: value
            });
            fillKey ++;
        });
        return {
            chartData: chartData,
            chartLabels: chartLabels,
            noChartData: noChartData,
            chartType: chartType
        };
    }
    yAxisFormatter (label) {
        switch (this.config.format.value) {
            case 'short':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 4;
                    while (n-- && !(f(n) < num)) {}
                    return (n === 0 ? num : Math.round(num / f(n)) + ('kmb'.split('')[n - 1])) || num.toFixed(2);
                })(label);
            case 'bytes':
                return ((num) => {
                    const f = i => Math.pow(1024, i);
                    let n = 6;
                    while (n-- && !(f(n) < num)) {}
                    return ((n === 0 ? num : Math.round(num / f(n)) + ('KMGTP'.split('')[n - 1])) || num.toFixed(0)) + 'b';
                })(label);

        }
        return label; // DEFAULT: type == 'number' | 'row':
    }
}

const ip = new InfluxProcessor();

addEventListener('message', ({ data }) => {
    const { metaData, srcdata } = JSON.parse(data);
    if (metaData && metaData.workerCommand) {
        const result = ip[metaData.workerCommand](srcdata);
        const response = JSON.stringify(result);
        postMessage(response);
    } else {
        postMessage(JSON.stringify({ error: 'metaData.workerCommand is undefined' }));
    }
});
