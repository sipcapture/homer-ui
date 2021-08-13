import { FlowItemType } from '@app/models/flow-item-type.model';


import { SearchCallService } from './../../../services/search/call.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Functions, setStorage, getStorage } from '@app/helpers/functions';
import { PreferenceAdvancedService, PreferenceAgentsubService, AgentsubService, PreferenceHepsubService } from '@app/services';
import { AgentRequestModel } from '@app/models/agent-request-model';
import { MessageDetailsService } from '../../../services/message-details.service';
import * as moment from 'moment';

@Component({
  selector: 'app-detail-dialog',
  templateUrl: './detail-dialog.component.html',
  styleUrls: ['./detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailDialogComponent implements OnInit, OnDestroy {
  _sipDataItem: any;
  @Input() titleName = 'Call-ID';
  @Input() titleId: string;
  @Input() request: any;
  @Input() qosData: any;
  @Input() headerColor: any;
  @Input() mouseEventData: any;
  @Input() snapShotTimeRange: any;
  @Input() rowData: any;
  @Input() config: any;
  isWindow = true;
  _qosData: any;
  tabStringIndex = 'Flow';
  isFilterOnMediaReport = true;
  IdFromCallID;
  activeTab = 0;
  get graphId() {
    return this.getTabs.findIndex((item) => item === 'Graph');
  };
  originalOrder = Functions.originalOrder;
  agents;
  objectKeys = Object.keys;
  agentsActive = false;
  agentRequest: AgentRequestModel = {
    protocol: '',
    host: '',
    port: 0,
    path: '',
    type: '',
    node: '',
  };
  agentsData = {
    data: []
  };

  tabs = {
    messages: false,
    flow: false,
    qos: false,
    logs: true,
    callinfo: true,
    tdr: true,
    export: false,
    geo: false
  };

  public metricType = 'mos';
  public metricTypes = {
    'mos': 'Mean MOS (0-4.5)',
    'jitter': 'Mean Jitter (ms)',
    'delta': 'Delta (ms)',
    'skew': 'Skew (ms)',
    'bytes': 'Bytes (b)',
    'pl': 'Packet Loss',
    'packets': 'Total Packets',
  };
  _flowFilters: any;

  set flowFilters(val: any) {
    this._flowFilters = val;
  }
  get flowFilters() {
    return this._flowFilters;
  }
  exportAsPNG = false;
  isBrowserWindow = false;
  _isLoaded = false;
  _showLoader = false;
  set showLoader(val: boolean) {
    this._showLoader = val;
    setInterval(() => {
      this.cdr.detectChanges();
    }, 5);
  }
  get showLoader() {
    return this._showLoader;
  }
  checkboxListFilterPayloadType = [];
  checkboxListFilterPayloadTypeMetricChart = [];
  checkboxListFilterPort = [];
  checkboxListFilterCallId = [];
  tabIndexByDefault = 0;
  sharedGUID = '';
  arrMessageDetail: any[] = [];
  _route_paramsSubscription: Subscription;
  objectData: any;
  graphSettings;
  private limitRange: any = {
    from: -300000, // - 5min
    to: 300000, // + 5min
    message_from: -5000, // - 1sec
    message_to: 5000, // + 1sec
  };

  @Input('sipDataItem')
  get sipDataItem() {
    return this._sipDataItem;
  }
  set sipDataItem(data) {
    if (!data?.data) {
      return;
    }
    this.saveStateOnStorage(data);
    this._sipDataItem = data;
    if (this._sipDataItem?.data?.qosData) {
      this._qosData = this._sipDataItem?.data?.qosData;
    }
    this._sipDataItem.metadata = { dataType: data.type };
    this._isLoaded = !!this._sipDataItem;
    const { callid, messages } = data.data || {};
    const [callidFirst] = callid || [];

    this.tabs.qos = !!messages.find(i => i.QOS);

    this.IdFromCallID = callidFirst;

    this.checkStatusTabs();

    this.cdr.detectChanges();
  }
  @Input('isLoaded')
  set isLoaded(val) {
    this._isLoaded = val;
    this.cdr.detectChanges();
  }
  get isLoaded(): boolean {
    return this._isLoaded;
  }
  protocol_profile: string;
  private dateFormat: string;


  @Output() openMessage: EventEmitter<any> = new EventEmitter();
  @Output() close: EventEmitter<any> = new EventEmitter();


  constructor(
    private _pas: PreferenceAdvancedService,
    private cdr: ChangeDetectorRef,
    private _pass: PreferenceAgentsubService,
    private _agss: AgentsubService,
    private _phss: PreferenceHepsubService,
    private _route: ActivatedRoute,
    private _scs: SearchCallService,
    private messageDetailsService: MessageDetailsService
  ) { }
  updateGraphSettings(e) {
    this.graphSettings = Functions.cloneObject(e);
    this.cdr.detectChanges();
  }
  saveStateOnStorage(data = null) {
    if (!this.sharedGUID) {
      this.sharedGUID = Functions.newGuid();
    }
    this.objectData = {
      titleId: this.titleId,
      rowData: this.rowData,
      mouseEventData: this.mouseEventData,
      sipDataItem: data,
      snapShotTimeRange: this.snapShotTimeRange,
      headerColor: this.headerColor,
      isLoaded: this.isLoaded,
      request: this.request,
    };
    // setStorage(this.sharedGUID, this.objectData);
  }
  async ngOnInit() {
  
    this._route_paramsSubscription = this._route.params.subscribe((params: any) => {
      this.isWindow = !params?.uuid;

      if (this.isWindow) {
        // save data to storage
        this.saveStateOnStorage();
        // console.log({ params });
      } else {
        const storageData = window['objectData'] || {};
        this.titleId = storageData.titleId;
        this.rowData = storageData.rowData;
        this.mouseEventData = storageData.mouseEventData;
        this.sipDataItem = storageData.sipDataItem;
        this.snapShotTimeRange = storageData.snapShotTimeRange;
        this.headerColor = storageData.headerColor;
        this.isLoaded = storageData.isLoaded;
        this.request = storageData.request;

        localStorage.removeItem(params?.uuid);
        setTimeout(() => {
          this.onBrowserWindow(!this.isWindow);
          this.isLoaded = true;
          this.showLoader = false;
        }, 1000);

        // console.log({ storageData })
      }
      this.getAgents();
      this.setTabByAdvanced();
      this.cdr.detectChanges();
    });
    this.messageDetailsService.event.subscribe(windowData => {
      if (!this.isWindow) {
        // console.log({ windowData });
        this.addWindowMessage({ data: windowData.message }, null, windowData.metadata);
      }
    });
  }

  checkStatusTabs() {
    this.tabs.logs = true; // this.dataLogs.length > 0;
    this.tabs.messages = this.tabs.flow = this.sipDataItem?.data?.messages?.length > 0;
    this.tabs.export = this.sipDataItem?.data?.messages && !!this.IdFromCallID;
    this.tabs.callinfo = this.sipDataItem.data.messages.length > 0; // check protokols
    this.tabs.tdr = this.tabs?.callinfo;
    const transaction = this.sipDataItem?.data?.data?.transaction?.[0]?.data;
    if (!((transaction?.geolan === 0 && transaction?.geolat === 0)
      || (transaction?.destlan === 0 && transaction?.destlat === 0)
      || (transaction?.geolan === undefined && transaction?.geolat === undefined)
      || (transaction?.destlan === undefined && transaction?.destlat === undefined))) {
      this.tabs.geo = true;
    }
  }
  onTabQos(isVisible: boolean) {
    setTimeout(() => {
      this.tabs.qos = isVisible;
      if (isVisible) {
        const isRTP = this._qosData?.rtp?.data?.length > 0;
        if (isRTP) {
          this.checkboxListFilterPayloadType.push({
            payloadType: '5',
            selected: true,
            title: 'RTP'
          });
          // this.doFilterMessages();
          this.cdr.detectChanges();
        }
      }
      this.cdr.detectChanges();
    }, 0);
    this.tabs.qos = isVisible;
    this.cdr.detectChanges();
  }
  onClose() {
    this.close.emit();
  }

  addWindow(data: any) {
    // console.log('addWindow', { data });
    if (!this.isWindow) {
      this.openMessage.emit({
        data: data,
        isBrowserWindow: this.isBrowserWindow
      });
    }
  }

  onBrowserWindow(event) {
    this.isBrowserWindow = event;
    const { callid } = this.sipDataItem.data;
    const indexParentWindow = callid?.join('---');
    this.messageDetailsService.setParentWindowData(indexParentWindow, {
      isBrowserWindow: event
    });
  }
  isFilterIcon() {
    if (this.tabStringIndex === 'Media Reports') {
      return this.isFilterOnMediaReport;
    }
    return ['Message', 'Flow', 'Timeline', 'Media Reports', 'Graph'].includes(this.tabStringIndex);
  }
  async setTabByAdvanced() {
    const advanced = await this._pas.getAll().toPromise();
    if (advanced?.data) {
      try {
        const params = Functions.getUriJson();
        const category = params && params.param ? 'export' : 'search';
        const setting = advanced.data.find(i => i.category === category && i.param === 'transaction');
        if (setting && setting.data) {
          const { tabpositon } = setting.data;
          if (tabpositon && typeof tabpositon === 'string' && tabpositon !== '') {
            this.tabIndexByDefault = Object.keys(this.tabs).indexOf(tabpositon);
            this.activeTab = this.tabIndexByDefault;
            this.cdr.detectChanges();
          }
        }
      } catch (err) { }
    }
  }
  resizeMap() {
    Functions.emitWindowResize();
  }
  onExportFlowAsPNG() {
    this.exportAsPNG = true;
  }

  // process Agents data
  async getAgents() {
    const agents: any = await this._pass.getAll().toPromise();
    if (!agents) {
      return;
    }
    const hData: any = await this._phss.getAll().toPromise();
    if (!hData) {
      return;
    }

    this.agents = agents.data;
    const HepList = hData.data?.map(({ mapping: { lookup_profile } }) => lookup_profile) || [];
    this.agents.forEach(agent => {
      /** if exist an agent on hepsub list */
      if (HepList.includes(agent.type)) {
        const agReq = this.formatRequest(agent, this.agentRequest);
        // this.sendRequest(agReq, agReq.type);
      }
    });

    // console.log('this.agents', this.agents);
    // console.log('HepList', HepList);
  }
  formatRequest(agent: any, agObj: any) {
    Object.entries(agent).forEach(([key, value]) => {
      agObj[key] = value;
    });
    // console.log(agObj);
    return agObj;
  }
  async sendRequest(agent, type?) {
    try {
      const agentActiveData = await this._agss.getData(agent, type).toPromise();
      // console.log({ agentActiveData });
      if (!agentActiveData) {
        return;
      }
      const iagent = agentActiveData.data;
      this.agentsActive = true;
      this.agentsData.data.push(Functions.JSON_parse(iagent));
    } catch (error) {
      // console.error(error);
    }
    return;
  }
  onSelectedTabChange({ tab: { textLabel } }) {
    this.showLoader = true;
    setTimeout(() => {
      Functions.emitWindowResize();

      this.tabStringIndex = textLabel;
      if (textLabel === 'Geo') {
        this.resizeMap();
      }
    }, 1);
  }
  selectTab(event) {
    this.activeTab = event;
  }

  get getTabs(): Array<string> {
    const isWebshark = !!(this.sipDataItem?.data?.messages?.[0]?.source_data?.frame_protocol);
    return [
      // isWebshark && 'Webshark',
      !isWebshark && this.tabs.messages && 'Message',
      'Flow',
      // 'Timeline',
      this.tabs.callinfo && 'Session Info',
      // this.tabs.qos && 'Media Reports',
      'Graph',
      // this.sipDataItem.data.dtmf && 'DTMF',
      this.tabs.geo && 'Geo',
      // this.sipDataItem?.data?.recording?.rtp?.length > 0 && 'Recording',
      this.objectKeys(this.sipDataItem.data.hostinfo).length !== 0 && 'Events',
      this.agentsActive && 'Sub',
      // this.tabs.tdr && 'TDR',
      this.tabs.logs && 'Logs',
      this.sipDataItem?.data?.qosData && 'QoS',
      'Export',
    ].filter(i => !!i);
  }
  ngOnDestroy() {
    this._route_paramsSubscription?.unsubscribe();
  }


  public addWindowMessage(row: any, mouseEventData = null, arrowMetaData: any = null) {
    if (!row?.data) {
      return;
    }
    const uniqueId = row?.data?.uniqueId || row?.data?.uuid || row?.data?.id;
    const isSetWindow = this.arrMessageDetail.find(
      ({ uuid }) => `${uuid}` === `${uniqueId}`
    );



    if (isSetWindow) {
      isSetWindow.mouseEventData?.focus();
      return;
    }
    const isLOG = !!(row?.data?.type === FlowItemType.LOG);
    const color = Functions.getColorByString(row.data.method || 'LOG');

    const mData = {
      loaded: false,
      arrowMetaData,
      data: {} as any,
      rowData: null, /// this.rowData as any,
      id: row.data.id ? `${row.data.id}` : `${row.data.event}`,
      uuid: uniqueId,
      headerColor: (isLOG ? 'black' : color) || '',
      mouseEventData: mouseEventData || row.data.mouseEventData,
      isBrowserWindow: arrowMetaData ? !!arrowMetaData.isBrowserWindow : false,
    };

    this.arrMessageDetail.push(mData);

    mData.data = Functions.cloneObject(row.data.item || row.data || {});
    mData.data.item = Functions.cloneObject({ raw: mData?.data?.raw || mData?.data?.message });

    /**
     *   (DECODED)
     */
    const uuid = row?.data?.item?.uuid;
    // if (false && !isLOG && uuid) {
    //     const _protocol_profile = row?.data?.profile || this.protocol_profile;
    //     let timestamp = {
    //         from: row.data.micro_ts + this.limitRange.message_from, // - 1sec
    //         to: row.data.micro_ts + this.limitRange.message_to, // + 1sec
    //     };
    //     if (!timestamp.from || !timestamp.to) {
    //         timestamp = this.config.timestamp;
    //     }
    //     const _is = name => !!_protocol_profile.match(name);
    //     const request = {
    //         param: {
    //             ...Functions.cloneObject(this.config.param || {}),
    //             ...{
    //                 location: row?.data?.node ? { node: [row.data.node] } : {},
    //                 search: {
    //                     [_protocol_profile]: {
    //                         uuid: [uuid],
    //                     }
    //                 },
    //                 transaction: {
    //                     call: _is('call'),
    //                     registration: _is('registration'),
    //                     rest: _is('default'),
    //                 }
    //             }
    //         },
    //         timestamp
    //     };

    //     if ((row.data?.dbnode || row.data?.node) && request.param.location?.node) {
    //         request.param.location.node = [row.data?.dbnode || row.data?.node];
    //     }

    //     this._scs.getDecodedData(request).toPromise().then(res => {
    //         const [objDecoded] = res?.data || [];
    //         if (objDecoded) {
    //             const { decoded } = objDecoded;

    //             if (decoded) {
    //                 const [_decoded] = decoded || [];
    //                 mData.data.decoded = _decoded?._source?.layers || _decoded || decoded;
    //             }
    //         }
    //     }, err => { });
    //     /**
    //      * END DECODED
    //      */
    // }
    mData.data.messageDetailTableData = Object.entries(Functions.cloneObject(mData.data))
      .filter(([name]) => !['mouseEventData', 'raw', 'item'].includes(name))
      .map(([name, value]: any[]) => {
        if (name === 'create_date') {
          value = moment(value * 1).format(this.dateFormat);
        }
        return { name, value };
      });

    mData.loaded = true;
    this.cdr.detectChanges();
  }

  public closeWindowMessage(id: number) {
    this.arrMessageDetail.splice(id, 1);
    this.cdr.detectChanges();
  }
}
