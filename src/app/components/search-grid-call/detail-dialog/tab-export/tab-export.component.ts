import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { ExportCallService, FileType } from '@app/services/export/call.service';
import { Functions } from '@app/helpers/functions';
import { CopyService, PreferenceAdvancedService } from '@app/services';
import { PreferenceIpAliasService } from '@app/services';
import { AlertService } from '@app/services';
import { AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tab-export',
  templateUrl: './tab-export.component.html',
  styleUrls: ['./tab-export.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabExportComponent implements OnInit, AfterViewInit {
  @Input() callid;
  @Input() id;
  @Input() dataItem: any;
  @Input() snapShotTimeRange: any;
  @Input() request: any;

  url = '';
  whitelistIP = [];
  listIP = [];
  pcapsuleIP = [];
  listAdvancedCIDR = [];
  listAliasCIDR = [];
  isArchive = true;
  enableSIPP = false;
  enablePCAPSule = false;

  @Output() exportFlowAsPNG: EventEmitter<any> = new EventEmitter();
  @Output() ready: EventEmitter<any> = new EventEmitter();
  constructor(
    private _pias: PreferenceIpAliasService,
    private _pas: PreferenceAdvancedService,
    private _ecs: ExportCallService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    public translateService: TranslateService,
    private copyService: CopyService,
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
  }

  ngOnInit() {
    this._pas.getAll().toPromise().then((advanced: any) => {

      const [exportData] = advanced.data
        .filter(i => i.category === 'export' && i.param === 'transaction')
        .map(i => i.data);

      this.enableSIPP = exportData?.exportsipp === true;
      this.enablePCAPSule = exportData?.pcapsule === true;


      [this.listAdvancedCIDR] = advanced.data
        .filter(i => i.category === 'export' && i.param === 'transaction')
        .map(i => i.data.excludedCIDR);

      this._pias.getAll().then((aliases: any) => {
        const listAliasCIDR = aliases.data;
        if (typeof this.listAdvancedCIDR !== 'undefined') {
          this.listAdvancedCIDR.forEach(host => {
            if (!this.listIP.some(ip => ip === host.ip) && !host.hasOwnProperty('alias')) {
              const [aliasCIDR] = Functions.cloneObject(listAliasCIDR).filter(alias => alias.ip === host.ip);
              const parsedHost = {
                ip: host.ip,
                alias: aliasCIDR && aliasCIDR.alias ? ` : ${aliasCIDR.alias}` : ''
              }
              this.listIP.push(parsedHost);
              if (!host.disabled) {
                this.whitelistIP.push(parsedHost);
              }
            } else if (host.hasOwnProperty('alias')) {
              const [aliasCIDR] = Functions.cloneObject(listAliasCIDR).filter(alias => alias.alias === host.alias);
              if (typeof aliasCIDR !== 'undefined') {
                const parsedHost = {
                  ip: `${aliasCIDR.ip}/${aliasCIDR.mask}`,
                  alias: ` : ${aliasCIDR.alias}`
                };
                this.listIP.push(parsedHost);
                if (!host.disabled) {
                  this.whitelistIP.push(parsedHost);
                }
              }
            }
          });
        }
        this.dataItem.data.hosts.forEach(host => {
          if (!this.listIP.some(ip => ip.ip === host.ip)) {
            const [aliasCIDR] = Functions.cloneObject(listAliasCIDR).filter(alias => alias.ip === host.ip);
            this.listIP.push({
              ip: host.ip,
              alias: aliasCIDR && aliasCIDR.alias ? ` : ${aliasCIDR.alias}` : ''
            });
          }
        });
        this.cdr.detectChanges();
      });
    });
    if (this.getDBNode() !== null) {
      this.isArchive = false;
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.ready.emit({});
    }, 35);
  }

  private getDBNode() {
    const [firstMessage] = this.dataItem?.data?.messages || [];
    const { dbnode, node } = firstMessage || {};
    return dbnode || node;
  }

  private getQuery(): any {
    const query = Functions.cloneObject(this.request);
    query.timestamp = Functions.cloneObject(this.snapShotTimeRange);
    const dbNode = this.getDBNode();
    if (dbNode && query.param?.location) {
      query.param.location = {
        node: [dbNode]
      };
    }
    query.param.whitelist = this.whitelistIP.map(host => host.ip);
    return query;
  }

  private isPrivateIP(ip) {
    const parts = ip.split('.');
    return parts[0] === '10' ||
      (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
      (parts[0] === '192' && parts[1] === '168');
  }

  private htonl(val) {
    return ((val & 0xFF) << 24)
      | ((val & 0xFF00) << 8)
      | ((val >> 8) & 0xFF00)
      | ((val >> 24) & 0xFF);
  }

  private hashByIP(a) {
    let m = a.match(/^(?:\d{1,3}(?:\.|$)){4}/); // IPv4
    if (m) {
      m = m[0].split('.');
      let sumNet = m.map((octet, index, array) => {
        return parseInt(octet) * Math.pow(256, (array.length - index - 1));
      }).reduce((prev, curr) => {
        return prev + curr;
      });
      /* not needed to convert htonl */
      return sumNet >>> 0;
    }

    // IPv6
    m = a.match(/^((?:[\da-f]{1,4}(?::|)){0,8})(::)?((?:[\da-f]{1,4}(?::|)){0,8})$/);
    if (m) {
      let ip_string = a.replace(/^:|:$/g, '');
      let ipv6 = ip_string.split(':');
      for (var i = 0; i < ipv6.length; i++) {
        let hex = ipv6[i];
        if (hex != "") {
          // normalize leading zeros
          ipv6[i] = ("0000" + hex).substr(-4);
        }
        else {
          // normalize grouped zeros ::
          hex = [];
          for (var j = ipv6.length; j <= 8; j++) {
            hex.push('0000');
          }
          ipv6[i] = hex.join(':');
        }
      }
      let hash = 0;
      var newIPV6 = ipv6.join(':').split(':');
      for (var i = 0; i < newIPV6.length; i += 2) {
        var bin = parseInt(newIPV6[i].concat(newIPV6[i + 1]), 16);
        hash += this.htonl(bin);
      }
      return hash;
    }

    return 0;
  }

  private hashByPair(srcIP, srcPort, dstIP, dstPort, proto) {

    let totalHash = 0;

    /* src IP */
    totalHash += this.hashByIP(srcIP);
    /* dst IP */
    totalHash += this.hashByIP(dstIP);
    /* be sure that we have now uint32_t */
    totalHash = (totalHash & 0xffffffff);
    /* src Port */
    totalHash += srcPort;
    /* dst Port */
    totalHash += dstPort;
    /* Proto */
    totalHash += proto;
    /* check if src Port is bigger */
    totalHash += srcPort > dstPort ? 2 : 1;

    /* be sure that we have now uint32_t */
    totalHash = (totalHash & 0xffffffff);

    /* make it unsigned int */
    return totalHash >>> 0;
  }


  async getFile(type: FileType) {
    const PREFIX = 'export_';
    const ext = { Pcap: '.pcap', SIPP: '.xml', Text: '.txt', Report: '.zip' };
    const data = await this._ecs.postMessagesFile(this.getQuery(), type);
    Functions.saveToFile(data, PREFIX + this.id + ext[type]);
  }

  async getTimePCAPSule() {
    const PREFIX = 'pcapsule_';

    const messages = this.dataItem?.data?.data?.messages || [];
    const sdp = this.dataItem?.data?.data?.sdp || {};

    messages.forEach(message => {

      if (message.srcIp !== '0.0.0.0' && message.srcPort !== 0 &&
        !this.pcapsuleIP.some(ip => (ip.src_ip === message.srcIp && ip.src_port === message.srcPort)
          && ip.dst_ip === message.dstIp && ip.dst_port === message.dstPort)) {
        const proto = message.messageData?.protocol || 17;
        this.pcapsuleIP.push({
          src_ip: message.srcIp,
          src_port: message.srcPort,
          dst_ip: message.dstIp,
          dst_port: message.dstPort,
          proto: proto === 17 ? 'udp' : 'tcp',
          type: 'sip',
          hash: this.hashByPair(message.srcIp, parseInt(message.srcPort, 10),
            message.dstIp, parseInt(message.dstPort, 10),
            parseInt(proto, 10))
        });
      }
    });

    for (const [key, callid] of Object.entries(sdp)) {

      for (const [subkey, sdpEl] of Object.entries(callid)) {
        if (!this.pcapsuleIP.some(ip => ip.src_ip === sdpEl.mediaIpAudio && ip.src_port === sdpEl.mediaPortAudio)) {
          this.pcapsuleIP.push({
            src_ip: sdpEl.mediaIpAudio,
            src_port: sdpEl.mediaPortAudio,
            proto: 'udp',
            source: 'sdp',
            type: 'audio'
          });
        }

        if (sdpEl.mediaPortVideo !== 0) {

          if (!this.pcapsuleIP.some(ip => ip.ip === sdpEl.mediaIpVideo && ip.port === sdpEl.mediaPortVideo)) {
            this.pcapsuleIP.push({
              src_ip: sdpEl.mediaIpVideo,
              src_port: sdpEl.mediaPortVideo,
              proto: 'udp',
              source: 'sdp',
              type: 'video'
            });
          }

          if (this.isPrivateIP(sdpEl.mediaIpVideo)) {
            if (!this.pcapsuleIP.some(ip => ip.src_ip === sdpEl.sourceSipIP && ip.src_port === sdpEl.mediaPortAudio)) {
              this.pcapsuleIP.push({
                src_ip: sdpEl.sourceSipIP,
                src_port: sdpEl.mediaPortAudio,
                proto: 'udp',
                source: 'sdp',
                type: 'video',
                action: 'nat'
              });
            }
          }
        }

        if (this.isPrivateIP(sdpEl.mediaIpAudio)) {
          if (!this.pcapsuleIP.some(ip => ip.src_ip === sdpEl.sourceSipIP && ip.src_port === sdpEl.mediaPortAudio)) {
            this.pcapsuleIP.push({
              src_ip: sdpEl.sourceSipIP,
              src_port: sdpEl.mediaPortAudio,
              proto: 'udp',
              source: 'sdp',
              type: 'audio',
              action: 'nat'
            });
          }
        }
      }
    }

    const query = {
      'timestamp': Functions.cloneObject(this.snapShotTimeRange),
      'limit': 5000,
      'params': this.pcapsuleIP
    }

    const data = await this._ecs.getPCAPSuleFile(query);
    Functions.saveToFile(data, PREFIX + this.id + '.pcap');
  }

  // async onShareLink() {
  //   if (this.url === '') {
  //     const data = await this._ecs.postShareLink(this.getQuery()).toPromise();
  //     if (data.data.url === '/share/#') {
  //       this.url = window.location.origin + data.data.url + data.data.uuid;
  //     } else {
  //       this.url = data.data.url + data.data.uuid;
  //     }
  //   }
  //   window.open(this.url, '_blank');
  // }

  onShareLink() {
    // const param = Functions.getUriJson();
    const json = this.getQueryForShareLink();
    const queryJson = encodeURIComponent(JSON.stringify(json)) + '=';
    const url = window.location.origin + '/search/result?' + queryJson;

    window.open(url, '_blank');
  }
  async onCopyLink() {
    if (this.url === '') {
      const data = await this._ecs.postShareLink(this.getQuery()).toPromise();
      if (data.data.url === '/share/#') {
        this.url = window.location.origin + data.data.url + data.data.uuid;
      } else {
        this.url = data.data.url + data.data.uuid;
      }
    }
    let notification = ''
    this.translateService.get('notifications.success.shareLinkCopy').subscribe(res => {
      notification = res;
    })
    this.copyService.copy(this.url, notification);
  }
  onExportFlowAsPNG() {
    this.exportFlowAsPNG.emit({});
  }


  private getQueryForShareLink(): any {
    const { param: { search, transaction, timezone }, timestamp } = this.getQuery();
    Object.values(search).forEach((item: any) => item.uuid = []);
    return {
      timestamp,
      param: {
        search,
        location: {},
        transaction,
        id: {},
        timezone
      }
    };
  }
}
