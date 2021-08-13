import { Md5 } from 'ts-md5/dist/md5';

import * as moment from 'moment';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { WorkerCommands } from '@app/models/worker-commands.module';

class Functions {
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

  static getMethodColor(str) {
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
  static tosCheck(tos: number) {

    const dscp = tos >>> 2;

    if (dscp === 0) {
      return '0';
    }

    return {
      '8': 'CS1',
      '10': 'AF11',
      '12': 'AF12',
      '14': 'AF13',
      '16': 'CS2',
      '18': 'AF21',
      '20': 'AF22',
      '22': 'AF23',
      '24': 'CS3',
      '26': 'AF31',
      '28': 'AF32',
      '30': 'AF33',
      '32': 'CS4',
      '34': 'AF41',
      '36': 'AF42',
      '38': 'AF43',
      '40': 'CS5',
      '46': 'EF',
      '48': 'CS6',
      '56': 'CS7'
    }[dscp] + `(${dscp})` || dscp + '';
  }
  static md5object(obj: any): string {
    try {
      return Functions.md5(JSON.stringify(obj) || '');
    } catch (err) {
      return Functions.md5('');
    }
  }
  static md5(str: string): string {
    return Md5.hashAsciiStr(str) + '';
  }
  static cloneObject(src: any): any {
    try {
      return JSON.parse(JSON.stringify(src));
    } catch (err) { }

    return src;
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
  static newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r: any = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
  static arrayUniques(arr: string[]): string[] {
    return arr.sort().filter((i, k, a) => i !== a[k - 1]);
  }
}
export class TransactionServiceProcessor {
  public pipeDataTransaction(transactionData: any, _ipaliases: any) {
    if (!transactionData || !transactionData.data) {
      return transactionData;
    }

    transactionData.data.ipaliases = _ipaliases;
    if (!transactionData.data?.callid) {
      transactionData.data.callid = transactionData.data.messages.map(i => i.callid).sort().filter((i, k, a) => i !== a[k - 1]).filter(i => !!i);
    }
    const { calldata, messages, hosts, hostinfo, callid, uac, sdp, transaction, ipaliases = [] } = transactionData.data;
    let { alias } = transactionData.data;
    const aliasNonIps = Object.entries(alias)
      .filter(([key, val]) => key !== val)
      .reduce((a, b) => {
        const [key, value] = b;
        a[key] = value;
        return a;
      }, {});

    const ipaliasesAggrigated = ipaliases
      .filter(i => i.ip)
      .map(i => ({ [i.ip + ':' + i.port]: i.alias }))
      .reduce((a, b) => {
        const [key] = Object.keys(b);
        a[key] = b[key];
        return a;
      }, {});

    alias = Object.assign({}, ipaliasesAggrigated, aliasNonIps);
    const fullCallData = messages.map((messageItem: any) => {
      const callDataItem = calldata.find((j: any) => {
        return j.create_date === messageItem.create_date && j.id === messageItem.id;
      });
      const messagesKeys = Object.keys(messageItem);
      const calldataKeys = Object.keys(callDataItem);
      const allKeys = Functions.arrayUniques([].concat(messagesKeys, calldataKeys));

      const compareData: any = allKeys.map(key => {
        const [m, c] = [messageItem[key], callDataItem[key]];
        if ('data' === key) {
          try {
            return { data: JSON.parse(m) };
          } catch (_) {
            return { data: m };
          }
        }

        if (['micro_ts', 'table'].includes(key)) {
          return { [key]: m };
        }
        let outObj = [m, c];
        if (m === c) {
          outObj = m;
        } else if (m === null || c === null || m === undefined || c === undefined) {
          outObj = typeof m !== 'undefined' ? m : c;
        }
        return { [key]: outObj };
      }).reduce((a, b) => {
        Object.assign(a, b);
        return a;
      }, {});

      compareData.typeItem = FlowItemType.SIP;

      return compareData;
    });

    transaction?.forEach((trans: object) => {
      ['data', 'vqr_a', 'vqr_b'].forEach(name => {
        try {
          if (trans && trans.hasOwnProperty(name)) {
            trans[name] = JSON.parse(trans[name]);
          }
        } catch (_) { }
      });
    });
    const getAliasByIp = ip => this.getAliasByIp(ip, alias);
    let fullHosts = Object.values(hosts).map((m: any) => {

      if (!m.host) {
        throw console.error('HTTP ERROR: hosts is broken');
      }
      const [_ip] = m.host;

      const isIPv4 = _ip.match(/^\d+\.\d+\.\d+\.\d+(\:\d+)?$/g) !== null;
      let PORT = isIPv4 ? _ip?.match(/\:\d+/g)?.find(j => !!j).split(':')[1] * 1 : null;
      let IP = isIPv4 ? _ip?.match(/^\d+\.\d+\.\d+\.\d+/g)?.find(j => !!j) : _ip;
      if (!isIPv4) {
        // do parsing IPv6
        PORT = _ip.split(/\:/g).pop() * 1;
        IP = _ip.split(/\:\d+$/g).shift().replace(/\[|\]/g, '');
      }

      return {
        alias: getAliasByIp(_ip),
        host: isIPv4 ? _ip : `[${IP}]:${PORT}`,
        ip: IP,
        port: PORT || 0,
        isIPv4,
        position: m.position,
      };
    });

    fullHosts = Array.from({ length: fullHosts.length }, (m, k) => {
      return fullHosts.find(j => j.position === k);
    });

    if (uac) {
      Object.entries(uac).forEach(uacItem => {
        const [ip, obj]: [string, any] = uacItem;
        delete obj?.alias;
        Object.assign(fullHosts.find(h => h.ip === ip), obj);
      });
    }

    const sdpFlowItems = this.sdpFormatterToFlowItem(sdp);

    const out = {
      filters: {
        payload: {
          [FlowItemType.SIP]: true,
          [FlowItemType.SDP]: sdpFlowItems.length > 0,
          [FlowItemType.DTMF]: false,
          [FlowItemType.RTP]: false,
          [FlowItemType.RTCP]: false,
          [FlowItemType.LOG]: false
        },
        callid
      },
      ipaliases,
      alias,
      hosts: fullHosts,
      hostinfo: hostinfo || {},
      messages: [].concat(fullCallData, sdpFlowItems),
      callid: callid || [],
      uac: uac || {},
      data: transactionData.data,
    };
    return out;

  }
  public pipeDataQos(resData) {
    if (resData && resData.data && resData.data.reports) {
      const { data } = resData;
      const { reports, uac } = data;
      try {
        reports.forEach(item => {
          try {
            item.data = JSON.parse(item.data);
            item.message = JSON.parse(item.message);
            item.tabType = 'NetworkReport';
            item.messageType = ((item.message.SOURCE && item.message.SOURCE === FlowItemType.RTCP) || item.isRTCP) ?
              FlowItemType.RTCP : FlowItemType.RTP;
          } catch (_) { }
        });
        if (uac) {
          uac.forEach(item => {
            try {
              item.data = JSON.parse(item.data);
              item.tabType = 'UAReport';
              item.messageType = item.message.SOURCE &&
                item.message.SOURCE === FlowItemType.RTCP ?
                FlowItemType.RTCP : FlowItemType.RTP;
            } catch (_) { }
          });
          return [...reports, ...uac];
        }
        return reports;
      } catch (err) {
        console.error(err, { data });
        return [];
      }
    }
    return [];

  }
  public pipeDataDtmf(dtmfData: any) {


    const parseJson = (obj: any, srcData: string | Array<string>): any => {
      if (srcData instanceof Array) {
        srcData.forEach(i => {
          try {
            obj[i] = JSON.parse(obj[i]);
          } catch (err) { }
        });
      } else if (typeof srcData === 'string') {
        try {
          obj[srcData] = JSON.parse(obj[srcData]);
        } catch (err) { }
      }
    }
    const parseDTMF = (src: string): any => {
      let itams: Array<any> = src.split(';').filter(i => !!i);
      itams = itams.map(row => {
        const out: any = row.split(',').reduce((a, i) => {
          const [key, value] = i.split(':');
          a[key] = value * 1;
          return a;
        }, {});
        out.NUM = [, , , , , , , , , , '*', '#', 'A', 'B', 'C', 'D'][out.e] || out.e + '';
        out.duration = out.d;
        out.create_ts = (out.ts * 1000000 + out.tsu) / 1000;
        return out;
      });
      return itams;

    }

    const { data } = dtmfData || {};
    if (data) {
      data.forEach((item: any) => {
        parseJson(item, ['message', 'data']);
        item.DTMF = parseDTMF(item.message.DTMF || '');
      });
    }
    return dtmfData;
  }
  public pipeDataLogs(logsData: any) {
    // heplog processor
    return logsData;
  }
  private sdpFormatterToFlowItem(sdp: Array<any>): Array<any> {
    if (!sdp || sdp.length === 0) {
      return [];
    }

    const outSDP = [].concat(...Object.entries(sdp).map((i, k) => {
      return Object.entries(i[1]).map(j => {
        const outItem: any = j[1];
        outItem.callid = i[0];
        outItem.directionString = j[0];
        outItem.typeItem = FlowItemType.SDP;
        return outItem;
      });
    }));

    return outSDP;
  }

  public parseJson(obj: any, srcData: string | Array<string>): any {
    if (srcData instanceof Array) {
      srcData.forEach(i => {
        try {
          obj[i] = JSON.parse(obj[i]);
        } catch (err) { }
      });
    } else if (typeof srcData === 'string') {
      try {
        obj[srcData] = JSON.parse(obj[srcData]);
      } catch (err) { }
    }
  }
  public parseDTMF(src: string): any {
    let itams: Array<any> = src.split(';').filter(i => !!i);
    itams = itams.map(row => {
      const out: any = row.split(',').reduce((a, i) => {
        const [key, value] = i.split(':');
        a[key] = value * 1;
        return a;
      }, {});
      out.NUM = [, , , , , , , , , , '*', '#', 'A', 'B', 'C', 'D'][out.e] || out.e + '';
      out.duration = out.d;
      out.create_ts = (out.ts * 1000000 + out.tsu) / 1000;
      return out;
    });
    return itams;

  }

  public fullTransaction(data: any) {
    // console.log('parser.js', data)
    switch (data.type) {
      case 'full':
        data.tData.heplogs = {};
        break;
      case 'dtmf':
        data.tData.messages = this.extractDTMFitems(data.dtmfData, data.tData.messages);
        break;
      case 'logs':
        data.tData.messages = this.extractLOGitems(data.logsData, data.tData.messages);
        break;
      case 'qos':
        data.tData.messages = this.extractQOSitems(data.qosData, data.tData.messages);
        break;
    }
    data.tData.messages = this.formattingAsFLOWItem(data.tData, false);
    data.tData.hosts = this.reCheckHost(data.tData);
    return data.tData;
  }

  public reCheckHost({ messages, hosts, alias }) {
   
    const arrIPs = [].concat.apply([], messages.map(i => {
      try {
        const source_ipisIPv6 = i.source_ip.match(/\:/g)?.length > 1;
        const destination_ipisIPv6 = i.destination_ip.match(/\:/g)?.length > 1;
        const sIP = source_ipisIPv6 ? `[${i.source_ip}]` : i.source_ip;
        const dIP = destination_ipisIPv6 ? `[${i.destination_ip}]` : i.destination_ip;
        return [
          i.source_port ? `${sIP}:${i.source_port}` : sIP,
          i.destination_port ? `${dIP}:${i.destination_port}` : dIP
        ];
      } catch (err) {
        console.log(i, err);
      }
      return [];
    })).sort().filter((i, k, a) => a[k - 1] !== i);

    const getAliasByIp = ip => this.getAliasByIp(ip, alias);
    arrIPs.filter(_ip => !hosts.find(i => i.host === _ip)).forEach(_ip => {
      const isIPv4 = _ip.match(/^\d+\.\d+\.\d+\.\d+(\:\d+)?$/g) !== null;

      let PORT = isIPv4 ? _ip?.match(/\:\d+/g)?.find(j => !!j)?.split(':')[1] * 1 : null;
      let IP = isIPv4 ? _ip?.match(/^\d+\.\d+\.\d+\.\d+/g)?.find(j => !!j) : _ip;
      if (!isIPv4) {
        // do parsing IPv6
        PORT = _ip.split(/\:/g).pop() * 1;
        IP = _ip.split(/\:\d+$/g).shift().replace(/\[|\]/g, '');
      }

      hosts.push({
        alias: getAliasByIp(_ip),
        host: isIPv4 ? _ip : `[${IP}]:${PORT}`,
        ip: IP,
        port: PORT || 0,
        isIPv4,
        position: hosts.length,
      });

    });
    hosts.forEach(h => {
      if (!h.alias) {
        h.alias = getAliasByIp(h.host);
      }
    });

    return hosts;
  }
  private getAliasByIp(ip, alias) {
    const isIPv4 = ip.match(/^\d+\.\d+\.\d+\.\d+(\:\d+)?$/g) !== null;
    let PORT = isIPv4 ? ip?.match(/\:\d+/g)?.find(j => !!j)?.split(':')[1] * 1 : null;
    let IP = isIPv4 ? ip?.match(/^\d+\.\d+\.\d+\.\d+/g)?.find(j => !!j) : ip;
    let IP_PORT = ip;
    if (!isIPv4) {
      PORT = ip.split(/\:/g).pop() * 1;
      IP = ip.split(/\:\d+$/g).shift().replace(/\[|\]/g, '');
      IP_PORT = `[${IP}]:${PORT}`;
    }
    return alias[IP_PORT] || alias[IP + ':0'] || IP;
  }
  public formattingAsFLOWItem({ messages, filters, alias, data, dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS Z' }, __type = false) {
    const { transaction } = data || {};
    let prevTs = 0;
    let diffTs = 0;
    const getAliasByIp = ip => this.getAliasByIp(ip, alias);
    messages.forEach((message) => {
      if (!message.micro_ts) {
        message.micro_ts = message.create_date || message.create_ts || message.timeSeconds * 1000 + message.timeUseconds;
      }
    })
    return messages.sort((itemA, itemB) => {
      const a = itemA.micro_ts;
      const b = itemB.micro_ts;
      return a < b ? -1 : a > b ? 1 : 0;
    }).map((item, pid) => {
      const transactionByCallId = transaction?.find(c => c.callId === item.callId) || {};
      const [codecDataJSON] = transactionByCallId?.Codecs || [];
      const codecData = codecDataJSON ? JSON.parse(codecDataJSON) : null;
      const i = item.__is_flow_item__ ? item.source_data : item;
      const ts = parseInt(moment(i.micro_ts).format('x'), 10);
      if (prevTs === 0) {
        prevTs = ts;
      }
      diffTs = ts - prevTs;
      if (item.__is_flow_item__) {
        item.diff = `+${diffTs}ms`;
        return item;
      }
      (f => {
        const { SIP, SDP, RTP, RTCP, DTMF, LOG } = FlowItemType;
        f[SIP] = f[SIP] || i.typeItem === SIP;
        f[SDP] = f[SDP] || i.typeItem === SDP;
        f[RTP] = f[RTP] || i.typeItem === RTP;
        f[RTCP] = f[RTCP] || i.typeItem === RTCP;
        f[DTMF] = f[DTMF] || i.typeItem === DTMF;
        f[LOG] = f[LOG] || i.typeItem === LOG;
      })(filters.payload);

      const [sIP, sPORT, dIP, dPORT] = [
        i.source_ip || i.srcIp || i.sourceSipIP,
        i.source_port || i.srcPort || i.mediaPortAudio || 0,
        i.destination_ip || i.dstIp || i.destinationSipIP,
        i.destination_port || i.dstPort || i.mediaPortAudio || 0,
      ];

      const eventName = i.raw ? i.method_text : i.QOS ? i.type :
        (i.typeItem === FlowItemType.DTMF ?
          FlowItemType.DTMF + ` [${i.DTMFSingleData.NUM}]` : (
            i.typeItem === FlowItemType.LOG ? FlowItemType.LOG : 'SIP/SDP'
          ));

      const protoName = Functions.protoCheck(i.protocol).toUpperCase();

      i.raw_source = '' + i.raw;

      i.raw = this.stylingRowText(i.raw);
      const [sAlias, dAlias] = [getAliasByIp(`${sIP}:${sPORT}`), getAliasByIp(`${dIP}:${dPORT}`)];
      i.srcAlias = sAlias || sIP;
      i.dstAlias = dAlias || dIP;

      if (!item.sdp && i?.raw_source?.includes('Content-Type: application/sdp')) {
        item.sdp = true;
      }

      const { pt, rate, name } = codecData || {};
      const isRTP = i.typeItem === FlowItemType.RTP || i.typeItem === FlowItemType.RTCP;
      i.codecData = codecData;
      // PCMU/8000/PT:0
      const codecString = `${name || '--'}/${!isNaN(rate) ? rate : '--'}/PT:${!isNaN(pt) ? pt : '--'}`;
      const outDataItem = {
        id: i.id,
        codecData,
        callid: i.callid,
        method_text: i.sdp ? eventName + ` (SDP)${i.msg_info ? ' ' + i.msg_info : ''}` : eventName,
        method: eventName,
        description: i.ruri_user || (isRTP && (pt || name || rate) ? codecString : `${sIP}:${sPORT} -> ${dIP}:${dPORT}`),
        info_date: `[${i.id || '#' + (pid + 1)}] [${protoName}] ${moment(i.micro_ts).format(dateFormat)}`,
        diff: `+${diffTs.toFixed(3)}ms`,
        source_ip: sIP,
        source_port: sPORT,
        destination_ip: dIP,
        destination_port: dPORT,
        micro_ts: i.micro_ts,
        source_data: i,
        typeItem: i.typeItem,
        QOS: i.QOS,
        MOS: i.MOS,
        pid: pid,
        srcAlias: sAlias,
        dstAlias: dAlias,
        __is_flow_item__: true,
        messageData: {
          codecData,
          id: i.id || '--',
          create_date: moment(i.micro_ts).format('YYYY-MM-DD'),
          timeSeconds: moment(i.micro_ts).format('HH:mm:ss.SSS Z'),
          diff: `${diffTs.toFixed(2)} ms`,
          method: i.sdp ? eventName + ` (SDP)${i.msg_info ? ' ' + i.msg_info : ''}` : eventName,
          mcolor: Functions.getMethodColor(eventName),
          Msg_Size: i.raw ? (i.raw + '').length : '--',
          srcIp: sIP,
          dstIp: dIP,
          srcAlias: sAlias,
          dstAlias: dAlias,
          srcIp_srcPort: `${sIP}:${sPORT}`,
          dstIp_dstPort: `${dIP}:${dPORT}`,
          dstPort: dPORT,
          srcPort: sPORT,
          proto: protoName,
          type: i.typeItem,
          typeDisplay: Functions.methodCheck(i.proto || i.hepproto),
          tosDisplay: typeof i.ip_tos !== 'undefined' ? Functions.tosCheck(i.ip_tos) : '--',
          ip_tos: i.ip_tos,
          vlan: i.vlan,
          item: i
        }
      };
      return outDataItem;
    }).map(i => (i.__item__index__ = i.messageData.uniqueId = Functions.md5object(i), i));
  }
  stylingRowText(raw: string) {
    if (!raw) {
      return null;
    }
    raw += '';
    const regexMethod = new RegExp('INVITE|CANCEL|PRACK|ACK|BYE|OPTIONS', 'g');
    const regexReply = new RegExp('(SIP/2.0) (100|180|200|404|407|500|503) ', 'g');
    const regexpCallid = new RegExp('(Call-ID):(.*)', 'g');
    const regexpSDP = new RegExp('(m=(audio|video)) (.*)', 'g');
    const regexpTag = new RegExp('tag=.*', 'g');
    const regexHeaders = new RegExp('(.*): ', 'g');
    let color: string;
    raw = raw
      .replace(/\</g, '&lt;')
      .replace(/\>/g, '&gt;')
      .replace(regexpCallid, (g, a, c) => {
        color = 'blue';
        return `<span style="font-weight:bold">${a}:</span><span style="color:${color}">${c}</span>`;
      })
      .replace(regexpTag, (g, a) => {
        color = 'dimGray';
        return `<span style="font-weight:bold;color:${color}">${g}</span>`;
      })
      .replace(regexpSDP, (g, a) => {
        color = 'dimGray';
        return `<span style="font-weight:bold;color:${color}">${g}</span>`;
      })
      .replace(regexMethod, g => {
        color = 'blue';
        switch (g) {
          case 'INVITE':
            color = 'hsl(227.5,82.4%,51%)';
            break;
          case 'CANCEL':
            color = 'green';
            break;
          case 'BYE':
            color = 'hsl(120,100%,25%)';
            break;
          case 'ACK':
            color = 'orange';
            break;
        }

        return `<span style="font-weight:bold;color:${color}">${g}</span>`;
      })
      .replace(regexReply, (g, a, c: any) => {

        color = 'red';
        const b = parseInt(c, 10);
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
  public formattingToQosArray(qosData: any): Array<any> {
    // console.log('parser.js::formattingToQosArray', { qosData })
    return [].concat(...Object.entries(qosData).map(([type, item]): [any, any] => {
      const { data }: any = item || {};
      return data.map((item: any) => {
        var i:any = {}
        // callid: "1248811679-5066-83@BJC.BGI.II.CAD"
        i.callid = item.sid;
        // captid: 2222
        i.captid = item.captureId;
        // capture_ip: "136.243.16.181"
        i.capture_ip = item.srcIp;
        // create_ts: 1628777805804
        i.create_ts = new Date(item.create_date).getTime();
        // data: "{\"rt\":3,\"tss\":1628777805,\"tsu\":804825}"
        i.data = JSON.stringify({
          rt: 3,
          tss: item.timeSeconds,
          tsu: item.timeUseconds
        });
        // destination_ip: "80.100.47.83"
        i.destination_ip = item.dstIp;
        // destination_port: 10000
        i.destination_port = item.dstPort;
        // event: "rtp_stats"
        i.event = "rtp_stats"
        // message:
        i.message = item.raw;
        // mos: 425
        try {
          i.mos = JSON.parse(item.raw).MOS;
        } catch (e) { }
        i.isRTCP = type === 'rtcp';
        // node: ""
        i.node = item.dbnode;
        // proto: 34
        i.proto = item.payloadType;
        // source_ip: "136.243.16.181"
        i.source_ip = item.srcIp;
        // source_port: 26918
        i.source_port = item.srcPort;
        // table: "rtp_stats"
        i.table = 'rtp_stats';
        // type: "report"
        i.type = 'report';
        // uuid: "ecd5d2fb-fb77-11eb-92fb-000019432987"
        i.uuid = Functions.newGuid();
        // vlan: 0
        i.vlan = 0;
        return i;
      })

    }));

  }
  public extractQOSitems(qosData: any, messages: Array<any>): Array<any> {
    if (qosData?.rtp || qosData?.rtcp) {
      qosData = this.pipeDataQos({
        data: {
          reports: this.formattingToQosArray(qosData)
        }
      });
      // console.log('formatted::', qosData);
    }
    if (!qosData || !Array.isArray(qosData)) {
      return messages;
    }
    const messagesLength = messages.length;

    const qos = qosData.map((item, key) => {
      let qosDetails: any;
      if (item.tabType && item.tabType === 'NetworkReport') {
        try {
          qosDetails = item.message;
          item.MOS = qosDetails.MOS || qosDetails.MEAN_MOS;
          item.qosTYPE = qosDetails.TYPE;
          item.qosTYPEless = qosDetails.TYPE.slice(0, 1).toUpperCase();
        } catch (_) {
          console.warn(item.message);
          item.MOS = 0;
        }
      }

      return {
        QOS: item,
        typeItem: item.messageType,
        id: messagesLength + key + 1,
        type: item.messageType,
        source_ip: item.source_ip,
        source_port: item.source_port,
        destination_ip: item.destination_ip,
        destination_port: item.destination_port,
        callid: item.callid,
        method: item.type,
        method_ext: `${item.source_ip} -> ${item.destination_ip}`,
        micro_ts: item.create_ts,
      };
    });

    return [...messages, ...qos];
  }
  private extractDTMFitems(dtmfData: any, messages: Array<any>): Array<any> {
    if (!dtmfData) {
      return messages;
    }

    const messagesLength = messages.length;
    const inc = 0;
    const dtmf: Array<any> = [];
    dtmfData.forEach(item => {
      if (item.DTMF && item.DTMF.length > 0) {
        item.DTMF.forEach(i => {
          const _item: any = Functions.cloneObject(item);
          _item.create_ts = Math.round(i.create_ts);
          dtmf.push({
            DTMFSingleData: i,
            DTMFitem: _item,
            typeItem: FlowItemType.DTMF,
            // id: messagesLength + (++inc) + 300,
            type: FlowItemType.DTMF,
            source_ip: _item.source_ip,
            source_port: _item.source_port,
            destination_ip: _item.destination_ip,
            destination_port: _item.destination_port,
            callid: _item.callid,
            method: FlowItemType.DTMF,
            method_ext: `${_item.source_ip} -> ${_item.destination_ip}`,
            micro_ts: _item.create_ts,
          });
        });
      }
    });

    return [...messages, ...dtmf];
  }
  private extractLOGitems(logsData: any, messages: Array<any>): Array<any> {
    if (!logsData) {
      return messages;
    }

    const messagesLength = messages.length;
    const logs = logsData.map((item, key) => {
      this.parseJson(item, ['data']);

      item.raw = item.raw || item.message;
      item.type = FlowItemType.LOG;
      return {
        item,
        typeItem: FlowItemType.LOG,
        id: item.id || messagesLength + key + 1,
        type: FlowItemType.LOG,
        source_ip: item.source_ip || item.srcIp,
        source_port: item.source_port || item.srcPort,
        destination_ip: item.destination_ip || item.dstIp,
        destination_port: item.destination_port || item.dstPort,
        callid: item.callid || item.sid,
        method: item.type,
        method_ext: `${item.source_ip} -> ${item.destination_ip}`,
        micro_ts: item.create_ts || new Date(item.create_date).getTime(),
      };
    });
    logsData.forEach(item => {

    });

    return [...messages, ...logs];
  }

}
export class TransactionProcessor {
  public transactionData(data, type) {
    const p = new TransactionServiceProcessor();
    switch (type) {
      case WorkerCommands.TRANSACTION_SERVICE_TRNS:
        return p.pipeDataTransaction(data.transactionData, data.ipaliases);
      case WorkerCommands.TRANSACTION_SERVICE_QOS:
        return p.pipeDataQos(data);
      case WorkerCommands.TRANSACTION_SERVICE_DTMF:
        return p.pipeDataDtmf(data);
      case WorkerCommands.TRANSACTION_SERVICE_FULL:
        return p.fullTransaction(data);
    }
  }
}
