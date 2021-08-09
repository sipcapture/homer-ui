/// <reference lib="webworker" />
import { Md5 } from 'ts-md5/dist/md5';

import * as moment from 'moment';
import { WorkerCommands } from '@app/models/worker-commands.module';
class Functions {
  static getColorByString(str: string, saturation?: number, lightness?: number, alpha?: number, offset?: number) {
    const col = Functions.getColorByStringHEX(str);
    /* const num = parseInt(col, 16) % 360; */
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(col);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    h = Math.round(h * 360);
    saturation = saturation || Math.round(s * 100);
    lightness = lightness || Math.round(l * 100);
    alpha = alpha || 1;
    offset = offset || 0;
    return `hsl(${h - offset}, ${saturation}%, ${lightness}%,${alpha})`;
  }
  static getColorByStringHEX(str: string) {
    if (str === 'LOG') {
      return 'FFA562';
    }
    let hash = 0;
    let i = 0;
    str = this.md5(str);
    for (i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    i = hash;
    let col = ((i >> 24) & 0xAF).toString(16) + ((i >> 16) & 0xAF).toString(16) +
      ((i >> 8) & 0xAF).toString(16) + (i & 0xAF).toString(16);
    if (col.length < 6) {
      col = col.substring(0, 3) + '' + col.substring(0, 3);
    }
    if (col.length > 6) {
      col = col.substring(0, 6);
    }
    return col;
  }
  static md5(str: string): string {
    return Md5.hashAsciiStr(str) + '';
  }
}
class ClickhouseProcessor {
  parseCommand(data, command) {
    switch (command) {
      case WorkerCommands.CLICKHOUSE_PARSE_DATA:
        return this.parseData(data);
      case WorkerCommands.CLICKHOUSE_PREPARE_RENDER_DATA:
        return this.renderingChart(data)
    }
    return null;
  }
  parseData(res) {
    const s = [];
    Object.keys(res.data).forEach(node => {
      if (typeof res.data[node] === 'undefined' || res.data[node] === null || res.data[node].length === 0) {
        return;
      }
      res.data[node].forEach(datapoint => {
        const index = Object.keys(datapoint).findIndex(i => i.match(/(count|avg|min|max)/))
        const property = Object.keys(datapoint)[index];
        const tags = Object.keys(datapoint).filter(item => item !== 't' && item !== property)
        const parsedDataPoint = {
          tags: tags,
          data: datapoint,
          value: datapoint[property],
          operator: property
        };
        s.push(parsedDataPoint);
      });
    });
    return s;
  }
  renderingChart(inData) {
    let chartType = inData.chartType;
    let data = inData.data;
    let options = inData.options;
    let isFill;
    if (chartType === 'area') {
      options.scales.yAxes[0].stacked = true;
      isFill = true;
      chartType = 'line';
    } else {
      isFill = false;
      options.scales.yAxes[0].stacked = false;
    }
    const noChartData = data.length === 0;
    let chartLabels = [];
    chartLabels = data
      .map(item => moment(item.data.t, 'x').format('HH:mm'))
      .sort((a, b) => a - b)
      .filter((item, index, array) => item !== array[index - 1]);
    let formattedData: Array<any>;
    formattedData = data.map(item => {
      const array = [];
      for (let i = 0; i < chartLabels.indexOf(moment(item.data.t, 'x').format('HH:mm')); i++) {
        array.push(null);
      }
      array.push(item.value);
      return {
        label: item.operator + ', ' + item.tags.map(tag => tag + ': ' + item.data[tag]).join(', '),
        value: array,
        tags: item.tags.map(tag => tag + ': ' + item.data[tag]).join(', ')
      };
    });
    let fillKey = 0;
    formattedData = formattedData.reduce((a, b) => {
      if (!a[b.label]) {
        a[b.label] = {
          tags: '',
          value: []
        };
      }

      const length = a[b.label].value.length;
      a[b.label] = {
        tags: b.tags,
        value: a[b.label].value.concat(b.value.slice(length))
      };

      return a;

    }, {})
    const chartData: Array<any> = [];
    Object.keys(formattedData).forEach(key => {
      const value = formattedData[key];
      const backgroundColor = Functions.getColorByString(value.tags, 50, 50, chartType === 'bar' ? 1 : 0.4)
      chartData.push({
        backgroundColor: backgroundColor,
        borderColor: Functions.getColorByString(value.tags, 50, 50),
        pointBackgroundColor: Functions.getColorByString(value.tags, 60, 60),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: Functions.getColorByString(value.tags, 60, 60, 0.8),
        fill: isFill ? 'origin' : false,
        label: key,
        data: value.value
      });
      fillKey++;
    });
    const outData = {
      data: chartData,
      labels: chartLabels,
      chartType: chartType,
      options: options,
      noChartData: noChartData
    }
    return outData
  }
}
const cp = new ClickhouseProcessor();

addEventListener('message', ({ data }) => {
  const { metaData, srcdata } = JSON.parse(data);
  console.log('WORKER::', { metaData, srcdata });
  if (metaData && metaData.workerCommand) {
    const outputData = cp.parseCommand(srcdata, metaData.workerCommand);
    const response = JSON.stringify(outputData);
    postMessage(response);
  } else {
    postMessage(JSON.stringify({ error: 'metaData.workerCommand is undefined' }));
  }
});
