import * as moment from 'moment';
import { Md5 } from 'ts-md5/dist/md5';
export class Functions {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r: any = Math.random() * 16 | 0;
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
        if (method) { return method; }

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
            return 'HEP-' + payload;
        }
    }

    static colorByMethod (method: string, payload: number) {

        if (method) {
            if (method === 'INVITE') {
                return '#00cc00';
            } else if (method === 'BYE') {
                return '#6600cc';
            } else if (method === 'CANCEL') {
                return 'red';
            } else if (method === '180' || method === '183') {
                return '#0099cc';
            } else if (method === '200') {
                return '#0000cc';
            } else if (method === '401' || method === '407' || method === '404') {
                return '#cc0033';
            } else if (method === '486') {
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


    static getMethodColor (str) {
        let color = 'hsl(0,0%,0%)';
        if (str === 'INVITE') {
            color = 'hsl(227.5,82.4%,51%)';
        } else if (str === 'BYE' || str === 'CANCEL') {
            color = 'hsl(120,100%,25%)';
        } else if (str >= 100 && str < 200) {
            color = 'hsl(0,0%,0%)';
        } else if (str >= 200 && str < 300) {
            color = 'hsl(120,70%,50%)';
        } else if (str >= 300 && str < 400) {
            color = 'hsl(280,100%,50%)';
        } else if (str >= 400 && str < 500) {
            color = 'hsl(15,100%,45%)';
        } else if (str >= 500 && str < 700) {
            color = 'hsl(0,100%,45%)';
        } else {
            color = 'hsl(0,0%,0%)';
        }
        return color;
    }
    static messageFormatter(dist: Array<any>) {
        const dataSource: Array<any> = [];
        let prevTimestamp = 0;
        dist.forEach(function(item) {
            const newTs = Math.round((item.timeSeconds * 1000) + (item.timeUseconds / 1000));
            if (typeof item.raw === 'object') {
                item.raw = JSON.stringify(item.raw);
            }
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
    static JSON_parse(jsonString: string): any {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            return null;
        }
    }
    static getUriParams(): any {
        return window.location.search ? window.location.search.split('&')
            .map(i => i.replace('?', '').split('='))
                .reduce((a, b) => (a[b[0]] = b[1], a), {}) : null;
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
    static secondsToHour(data: number = 0) {
        return new Date(data * 1000).toISOString().substr(11, 8);
    }

    static getTimeStamp(v: number, p: string): number {
        const vlength = v.toString().length;
        let tlength = 0;
        const s = 10;
        const ms = 13;
        const usec = 16;
        switch (p) {
          case 'sec' : tlength = s ;
          break;
          case 'msec' : tlength = ms;
          break;
          case 'usec' : tlength = usec;
          break;
          default: tlength = ms;
        }
      return Math.floor(v * Math.pow(10, (tlength - vlength)));
    }

    static stylingRowText(raw: string) {
    
        if (raw) {
            raw += '';
            const regexMethod = new RegExp('INVITE|CANCEL|PRACK|ACK|BYE|OPTIONS', 'g');
            const regexReply = new RegExp('(SIP/2.0) (100|180|200|404|407|500|503) ', 'g');
            const regexpCallid = new RegExp('(Call-ID):(.*)', 'g');
            const regexpConst = new RegExp('resolution=|keys=|user=|line=|reg-id=|uniq=|v=|o=|s=|c=|t=|a=|transport=|received=|branch=|username=|realm=|nonce=|uri=|response=|cnonce=|nc=|qop=|algorithm=|ftag=|lb=|r2=|lr=|rport=|party=|privacy=|screen=|refresher=','g')
            const regexpSDP = new RegExp('(m=(audio|video)) (.*)', 'g');
            const regexpRTPMap = new RegExp('(a=(rtpmap)):(.*)', 'g');
            const regexpTag = new RegExp(';tag=.*', 'g');
            const regexHeaders = new RegExp('(.*): ', 'g');
            let color: string;
            let background: string;
            let tag: string;
            raw = raw
                .replace(/\</g, '&lt;')
                .replace(/\>/g, '&gt;')
                .replace(regexpCallid, (g, a, c) => {
                    color = '#333333'
                    return `<span style="font-weight:bold">${a}:</span><span style="color:${color};font-weight:bold">${c}</span>`;
                })
                .replace(regexpConst, (g, a) => {
                    color = '#1DA1BF';
                    return `<span style="font-weight:bold">${g}</span>`;
                })
                .replace(regexpTag, (g, a) => {
                    color = '#2534af';
                    return `<span style="font-weight:bold;color:${color}">${g}</span>`;
                })
                .replace(regexpSDP, (g, a) => {
                    color = '#4C30AB';
                    return `<span style="font-weight:bold;color:${color}">${g}</span>`;
                })
                .replace(regexpRTPMap, (g, a) => {
                    color = '#45a3c9';
                    tag='#555555';
                    return `<span style="font-weight:bold;color:${color}">${g}</span>`;
                })
                .replace(regexMethod, g => {
                    color = 'blue';
                    switch (g) {
                        case 'INVITE':
                            color = 'hsl(227.5,82.4%,51%)';
                            break;
                        case 'CANCEL':
                            color = 'hsl(120,100%,25%)';
                            break;
                        case 'BYE':
                            color = 'hsl(120,100%,25%)';
                            break;
                        case 'ACK':
                            color = 'black';
                            break;
                    }

                    return `<span style="font-weight:bold;color:${color}">${g}</span>`;
                })
                .replace(regexReply, (g, a, c) => {

                    color = 'red';
                    const b = parseInt(c);
                    switch (b) {
                        case 100:
                            color = 'orange';
                            break;
                        case 180:
                            color = 'blue';
                            break;
                        case 183:
                            color = 'blue';
                            break;
                        case 200:
                            color = 'green';
                            break;
                        default:
                            if (b >= 300 && b < 400) {
                                color = 'blue';
                            }
                            break;
                    }

                    return `<span style="font-weight:bold">${a}</span> <span style="font-weight:bold;color:${color}">${c}</span> `;
                })
                .replace(regexHeaders, (g, a) => {
                    return `<span style="font-weight:bold">${g}</span> `;
                });

            return raw;
        }
    }

    static console2file(data, filename) {
        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        this.saveToFile(data, filename, 'txt/json');

    }
}
