import * as moment from 'moment';
import { Md5 } from 'ts-md5/dist/md5';
export class Functions {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r: any = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    static protoCheck (protocol: number) {
        if (protocol === 1) {
            return 'udp';
        } else if (protocol === 2) {
            return 'tcp';
        } else if (protocol === 3) {
            return 'wss';
        } else if (protocol === 17) { // UDP
            return 'udp';
        } else if (protocol === 22) { // tls
            return 'tls';
        } else if (protocol === 132) { // tls
            return 'sctp';
        } else if (protocol === 6) { // tcp
            return 'tcp';
        } else if (protocol === 4) {
            return 'sctp';
        } else {
            return 'udp';
        }
    }

    static methodCheck (method: string, payload: number ) {
        if(method) return method;

        if (payload === 1) {
            return 'SIP';
        } else if (payload === 5) {
            return 'RTCP';
        } else if (payload === 8) {
            return 'ISUP';
        } else if (payload === 38) {
            return 'DIAMETER';
        } else if (payload === 39) {
            return 'GSM-MAP';
        } else if (payload === 34) {
            return 'RTP-SHORT-R';
        } else if (payload === 35) {
            return 'RTP-FULL-R';
        } else if (payload === 100) {
            return 'LOG';
        } else if (payload === 1000) {
            return 'JSON-DYN';
        } else {
            return 'HEP-'+payload;
        }
    }

    static colorByMethod (method: string,payload: number) {

        if(method) {
            if (method === "INVITE") {
                return '#00cc00';
            } else if (method === "BYE") {
                return '#6600cc';
            } else if (method === "CANCEL") {
                return 'red';
            } else if (method=== "180" || method=== "183") {
                return '#0099cc';
            } else if (method=== "200") {
                return '#0000cc';
            } else if (method=== "401" || method=== "407" || method ==="404") {
                return '#cc0033';
            } else if (method=== "486") {
                return '#cc6600';
            } else {
                return 'black';
            }
        } else {
            if (payload === 5) {
                return 'blue';
            } else if (payload === 8) {
                return 'blue';
            } else if (payload === 38) {
                return 'blue';
            } else if (payload === 39) {
                return 'green';
            } else if (payload === 34) {
                return 'green';
            } else if (payload === 35) {
                return 'blue';
            } else if (payload === 100) {
                return 'red';
            } else {
                return 'red';
            }
        }
    }

    static getColorByString(str: string, saturation:number, lightness:number, alpha:number, offset?: number) {
        const col = Functions.getColorByStringHEX(str);
        const num = parseInt(col, 16) % 360;
        offset = offset || 0;
        return `hsl(${num - offset}, ${saturation}%, ${lightness}%,${alpha})`;
    }
    static getColorByStringHEX(str: string) {
        if (str === 'LOG') {
            return 'FFA562';
        }
        let hash = 0;
        let i = 0;

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
    static getMethodColor (str){
        let color:string = 'hsl(0,0%,0%)'
        if(str === 'INVITE'){
            color = 'hsl(227.5,82.4%,51%)'
        }else if(str === "BYE" || str === "CANCEL"){
            color = 'hsl(120,100%,25%)'
        }else if(str >= 100 && str < 200){
            color = 'hsl(0,0%,0%)'
        }else if(str >= 200 && str < 300){
            color = 'hsl(120,70%,50%)'
        }else if(str >= 300 && str < 400){
            color = 'hsl(280,100%,50%)'
        }else if(str >= 400 && str < 500){
            color = 'hsl(15,100%,45%)'
        }else if(str >= 500 && str < 700){
            color = 'hsl(0,100%,45%)'
        }else {
            color = 'hsl(0,0%,0%)'
        }
        return color
    }
    static messageFormatter(dist: Array<any>) {
        const dataSource: Array<any> = [];
        let prevTimestamp = 0;
        dist.forEach(function(item) {
            let newTs = Math.round((item.timeSeconds * 1000) + (item.timeUseconds / 1000));
            dataSource.push({
                id: item.id,
                create_date: moment( item.create_date ).format('YYYY-MM-DD'),
                timeSeconds: moment(newTs).format('HH:mm:ss.SSS'),
                timeUseconds: (item.timeUseconds / 1000).toFixed(3) + 's',
                diff:  (prevTimestamp === 0 ? 0 : (newTs - prevTimestamp) / 1000).toFixed(3) + ' s',
                method: Functions.methodCheck(item.method ? item.method : item.event, item.payloadType),
                mcolor: Functions.colorByMethod(item.method ? item.method : item.event, item.payloadType),
                Msg_Size: (item.raw + '').length,
                srcIp_srcPort: item.srcIp + ':' + item.srcPort,
                srcPort: item.srcPort,

                dstIp_dstPort: item.dstIp + ':' + item.dstPort,
                dstPort: item.dstPort,
                proto: Functions.protoCheck(item.protocol),
                type: item.raw.match(/^[A-Z]*/g).join(''),
                item: item
            });
            prevTimestamp = newTs;
        });
        return dataSource;
    }
    static cloneObject(src: any): any {
        try {
            return JSON.parse(JSON.stringify(src));
        } catch ( err ) { }

        return src;
    }
    static getUriParams(): any {
        return window.location.search ? window.location.search.split('&')
            .map(i => i.replace('?', '').split('='))
                .reduce((a, b) => (a[b[0]] = b[1], a), {}) : null;
    }
    static getUriJson(): any {
        if (window.location.search) {
            try {
                return JSON.parse(decodeURIComponent(window.location.search.slice(1,-1)));
            } catch (err) {
                console.error(new Error(err));
                return null;
            }
        } else {
            return null;
        }
    }
    
    static md5(str: string): string {
        return Md5.hashStr(str) + '';
    }
    static saveToFile (data, filename, type = 'application/octet-stream') {
        const file = new Blob([data], {type: type});
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
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

     static getTimeStamp(v: number,p: string):number {
        let vlength = v.toString().length
        let tlength = 0
        let s = 10
        let ms = 13
        let usec = 16
        switch(p){
          case 'sec' : tlength = s ;
          break;
          case 'msec' : tlength = ms;
          break;
          case 'usec' : tlength = usec;
          break;
          default: tlength = ms
        }
      return Math.floor(v * Math.pow(10, (tlength - vlength)))
    }
}
