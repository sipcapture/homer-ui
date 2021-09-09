import * as moment from 'moment';
import { Md5 } from 'ts-md5/dist/md5';
import { KeyValue } from '@angular/common';
export class Functions {
  static _colorBufer = {};
  static logTime = 0;
  // Alias Mapping Field List
  static amfList = ['server_type_in', 'server_type_out', 'ipgroup_in', 'ipgroup_out', 'source_ip', 'destination_ip', 'IPs'];
  static newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r: any = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  static protoCheck(protocol: number) {
    return {
      '1': 'udp',
      '2': 'tcp',
      '3': 'wss',
      '17': 'udp',
      '22': 'tls',
      '132': 'sigtran',
      '6': 'tcp',
      '4': 'sctp'
    }[protocol] || 'udp';
  }
  static methodCheck(payload: number) {
    return {
      '1': 'SIP',
      '5': 'RTCP',
      '8': 'ISUP',
      '38': 'DIAMETER',
      '39': 'GSM-MAP',
      '34': 'RTP-SHORT-R',
      '35': 'RTP-FULL-R',
      '100': 'LOG',
      '1000': 'JSON-DYN',
    }[payload] || 'HEP-' + payload;
  }
  static colorsByStatus(status: number, proto: string = '') {
    switch (proto) {
      case '60_call_h20': default: return ['white',
        '#CC1900', '#FF3332', '#B8F2FF', '#B8F2FF',
        '#44c51a', '#D7CAFA', '#FFF6BA', '#F41EC7',
        '#F41EC7', '#4bb42b', '#FFF6BA', '#FF7F7E',
        '#FF7F7E', '#F41EC7', '#F41EC7'][status] || '#FFF6BA';
      case '60_registration_h20': return [
        '#b5b5b5', '#dd5555', '#ff4444', '#2299bb',
        '#aa55dd', '#dd33dd', '#aaaaee', '#eecb1b',
        '#ff8811', '#eeaa66'
      ][status] || '#FFF6BA';
    }
  }

  static colorByMethod(method: string, payload: number) {
    return method ? {
      INVITE: '#00cc00',
      BYE: '#6600cc',
      CANCEL: 'red',
      '180': '#0099cc',
      '183': '#0099cc',
      '200': '#0000cc',
      '401': '#cc0033',
      '407': '#cc0033',
      '404': '#cc0033',
      '486': '#cc6600'
    }[method] || 'black' : {
      '5': 'blue',
      '8': 'blue',
      '38': 'blue',
      '39': 'green',
      '34': 'green',
      '35': 'blue',
      '100': 'red'
    }[payload] || 'red';
  }

  static colorByMos(mos: number) {
    let color = '';
    if (mos < 200) {
      color = 'red';
    } else if (mos < 300) {
      color = 'orange';
    } else if (mos < 400) {
      color = '#e9d600';
    } else {
      color = 'green';
    }
    return color;
  }

  static getMethodColor(str) {
    let color = 'hsl(0,0%,0%)';
    const regex = /\s*\(SDP\)\s*/;
    str = str.replace(regex, '');
    if (str === 'INVITE') {
      color = 'hsla(227.5, 82.4%, 51%, 1)';
    } else if (str === 'BYE' || str === 'CANCEL') {
      color = 'hsla(120, 100%, 25%, 1)';
    } else if (str >= 100 && str < 200) {
      color = 'hsla(0, 0%, 0%, 1)';
    } else if (str >= 200 && str < 300) {
      color = 'hsla(120, 70%, 50%, 1)';
    } else if (str >= 300 && str < 400) {
      color = 'hsla(280, 100%, 50%, 1)';
    } else if (str >= 400 && str < 500) {
      color = 'hsla(15, 100%, 45%, 1)';
    } else if (str >= 500 && str < 700) {
      color = 'hsla(0, 100%, 45%, 1)';
    } else {
      color = 'hsla(0, 0%, 0%, 1)';
    }
    return color;
  }

  static getColorByStatus(status) {
    let color = '#000';
    if (status === 1) {
      color = '#ea4b35';
    } else if (status === 2) {
      color = 'rgb(255, 51, 50)';
    } else if (status === 3) {
      color = 'rgb(184, 242, 255)';
    } else if (status === 4) {
      color = 'rgb(184, 242, 255)';
    } else if (status === 5) {
      color = '#44c51a';
    } else if (status === 6) {
      color = 'grey';
    } else if (status === 7) {
      color = '#FFF6BA';
    } else if (status === 8) {
      color = 'rgb(244, 30, 199)';
    } else if (status === 9) {
      color = 'rgb(244, 30, 199)';
    } else if (status === 10) {
      color = '#7bd062';
    } else if (status === 11) {
      color = 'rgb(255, 246, 186)';
    } else if (status === 12) {
      color = 'rgb(255, 127, 126)';
    } else if (status === 13) {
      color = 'rgb(255, 127, 126)';
    } else if (status === 14) {
      color = '#F41EC7';
    } else if (status === 15) {
      color = 'grey';
    }
    return color;
  }
  static getColorByString(str: string, saturation?: number, lightness?: number, alpha?: number, offset?: number) {
    const col = Functions.getColorByStringHEX(str);

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
  static MOSColorGradient(num, s?, l?): string {
    // https://www.w3schools.com/colors/colors_hsl.asp
    // adjusts value of mos have steeper gradient
    const modifier = num > 430 ? 1 : num > 400 ? 0.8 : num > 300 ? 0.75 : num < 200 ? 0.3 : 0.7;
    // converts mos with modifier to percentage and uses it as raw number for hue
    const hue = (num * modifier) / (450 / 100);
    return `hsl(${hue}, ${s ? s + '%' : '85%'}, ${l ? l + '%' : '55%'})`;
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
  static messageFormatter(dist: Array<any>) {
    return dist;
  }
  static cloneObject(src: any): any {
    try {
      return JSON.parse(JSON.stringify(src));
    } catch (err) { }

    return src;
  }
  static getUriParams(): any {
    if (!!window.location.hash) {
      return window.location.hash.replace('#', '');
    }
    const lsearch = window.location.search || '';
    return lsearch ? lsearch.split('&').map(i => i.replace('?', '').split('='))
      .reduce((a, b) => (a[b[0]] = b[1], a), {}) : { callid: null, from: null, to: null, uuid: null };
  }
  static getUriJson(): any {
    if (window.location.search) {
      try {
        return JSON.parse(decodeURIComponent(window.location.search.slice(1, -1)));
      } catch (err) {
        console.error(new Error(err));
        return null;
      }
    } else {
      return null;
    }
  }

  static md5(str: string): string {
    str = str || '';
    return Md5.hashAsciiStr(str) + '';
  }
  static saveToFile(data, filename, type = 'application/octet-stream') {
    const file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) {// IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
      const a = document.createElement('a'),
        url = URL.createObjectURL(file);
      a.href = url;
      a.target = '(file)';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }
  static secondsToHour(data: number = 0) {
    return new Date(data * 1000).toISOString().substr(11, 8);
  }
  static originalOrder(a: KeyValue<number, string>, b: KeyValue<number, string>): number {
    return 0;
  }
  static md5object(obj: any): string {
    try {
      return Functions.md5(JSON.stringify(obj) || '');
    } catch (err) {
      return Functions.md5('');
    }
  }

  static console2file(data, filename) {
    if (!data) {
      console.error('Console.save: No data');
      return;
    }

    if (!filename) { filename = 'console.json'; }

    if (typeof data === 'object') {
      data = JSON.stringify(data, undefined, 4);
    }

    this.saveToFile(data, filename, 'txt/json');

  }
  static JSON_parse(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      // console.log(e)
      return null;
    }
  }


  static log(...arg) { /** DEBUG PERFORMANCE */
    arg.forEach((_a, i) => {
      if (typeof _a === 'object') {
        arg[i] = this.cloneObject(_a);
      }
    });
    const dt = this.logTime ? performance.now() - this.logTime : 0;
    const dts = '[' + dt.toFixed(3) + 'ms]';
    this.logTime = performance.now();
  }

  /* alias mapping function to map fields into alias fields
  (multi select field on protosearch usage)
  AMF = Alias Mapping Field*/

  static isAMF(field: string): boolean {
    return this.amfList.includes(field);
  }
  // Alias Mapping IP
  static isAMIP(field: string): boolean {
    return ['source_ip', 'destination_ip', 'IPs'].includes(field);
  }
  // set Type of Alias Mapping field:
  // servertype | group | alias => IP
  static getAMF(field: string) {

    if (['server_type_in', 'server_type_out'].includes(field)) {
      return 'servertype';
    } else if (['ipgroup_in', 'ipgroup_out'].includes(field)) {
      return 'group';
    } else if (['source_ip', 'destination_ip', 'IPs'].includes(field)) { return 'alias'; }
    return null;
  }
  // Get the alias fields
  // get alias names if its servertype or group
  // get IP value if its alias => IP type
  static getAliasFields(aliasList: Array<any>): Object {
    const fields = {};
    this.amfList.forEach(f => {
      fields[f] = aliasList.map(m => ({
        name: m[this.getAMF(f)],
        value: m[this.isAMIP(f) ? 'ip' : this.getAMF(f)]
      }));
    });
    return fields;
  }

  static arrayUniques(arr: any[]): any[] {
    const isObject = !!arr.find(i => typeof i === 'object');
    if (isObject) {
      return arr.map(i => JSON.stringify(i)).sort()
        .filter((i, k, a) => i !== a[k - 1])
        .filter(i => !!i).map(i => this.JSON_parse(i));
    }

    return arr.sort().filter((i, k, a) => i !== a[k - 1]).filter(i => !!i);
  }
  static shareLinkUUID(): string {
    if (!!window.location.hash) {
      return window.location.hash.replace('#', '');
    }
    return null;
  }
  static getJsonFileDataByLink(name: string): Promise<any> {
    return new Promise((resolve) => {
      resolve(window[`file__json_data_${name}`] || {});
    });
  }

  static emitWindowResize(): void {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
  static validateTime(startTime, endTime) {
    startTime = moment(startTime).format('x');
    endTime = moment(endTime).format('x');
    return (startTime >= endTime);
  }
  static getColorRegistrationByStatus(status) {
    let color = '#000';
    if (status === 1) {
      color = '#ea4b35';
    } else if (status === 2) {
      color = 'rgb(255, 51, 50)';
    } else if (status === 3) {
      color = '#7bd062';
    } else if (status === 4) {
      color = 'rgb(184, 242, 255)';
    } else if (status === 5) {
      color = '#44c51a';
    } else if (status === 6) {
      color = 'grey';
    } else if (status === 7) {
      color = '#FFF6BA';
    } else if (status === 8) {
      color = 'rgb(244, 30, 199)';
    } else if (status === 9) {
      color = 'rgb(244, 30, 199)';
    }
    return color;
  }

}

export function log(...arg) {
  return Functions.log(...arg);
}

export function setStorage(key: string, value: any): void { // saving JSON from object data
  // log('setStorage >>>', key, value);
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStorage(key: string): any {
  // log('getStorage <<<', key, Functions.JSON_parse(localStorage.getItem(key)));
  return Functions.JSON_parse(localStorage.getItem(key));
}
