import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { AgentsubService } from '@app/services/agentsub.service';
import { Functions } from '@app/helpers/functions';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-tab-hepsub',
  templateUrl: './tab-hepsub.component.html',
  styleUrls: ['./tab-hepsub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabHepsubComponent implements OnInit, OnDestroy, AfterViewInit {
  _dataItem: any;

  @Input() id: any;
  @Input() callid: any;
  @Input() set dataItem(value: any) {
    this._dataItem = value;

    if (this.dataItem.data.heplogs) {
      this.dataLogs = this.dataItem.data.heplogs;
    }
    this.isLogs = this.dataLogs?.length > 0;

    const { agentCdr } = this._dataItem.data;
    console.log({ value });
    if (agentCdr) {
      this.subTabList.push({
        title: agentCdr.node
      });

      agentCdr.data.data = Functions.JSON_parse(agentCdr.data) || agentCdr.data;

      this.jsonData = agentCdr.data;

      // extract agent node information
      this.agentNode = agentCdr.node;
      this.agentUuid = agentCdr.uuid;
    }

    this.cdr.detectChanges();
  }
  get dataItem(): any {
    return this._dataItem;
  }
  @Input() dataLogs: Array<any>;
  @Input() snapShotTimeRange: any;
  @Output() haveData = new EventEmitter();
  @Output() ready: EventEmitter<any> = new EventEmitter();
  @ViewChild('matTabGroup', { static: false }) matTabGroup: MatTabGroup;
  indexTabPosition = 0;

  isLogs = true;
  subTabList = [];
  jsonData: any;
  timestamp: any; // PCAP timestamp (unix time)
  timestampString: string; // PCAP timestamp (UTC string)
  agentPathPcap: string;
  agentNode: string;
  agentUuid: string;
  _interval: any;
  constructor(
    private cdr: ChangeDetectorRef,
    private _ass: AgentsubService
  ) { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.ready.emit({});
    }, 35)
  }

  ngOnInit() {
    this._interval = setInterval(() => {
      this.matTabGroup.realignInkBar();
      this.cdr.detectChanges();
    }, 2000);

    this.agentPathPcap = this.jsonData[this.callid].pcap || 'not_set';
    this.timestamp = this.jsonData[this.callid].t_sec * 1000 || 0;
    this.timestampString = new Date(this.timestamp).toUTCString();
  }

  ngOnDestroy() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  async getPcap() {
    const request = this.getRequest()

    try {
      const blob = await this._ass.getHepsubElements({
        uuid: this.agentUuid,
        type: "download",
        data: request,
      }).toPromise();

      // move to function seek other downloads
      const timestamp = Functions.getTimestamp();
      const fName = `homer-rtp__${this.callid}__${timestamp}.pcap`;

      console.log('pcap downloaded, saving to file:', fName)
      Functions.saveToFile(blob, fName);
    } catch (err) {
      console.error('pcap download error:', err);
      alert('Problem while downloading the file');
      return;
    }
  }

  // generate request as expected by AgentsubService
  private getRequest() {
    return {
      param: {
        location: { node: ["local"] },
        search: {
          ['1_call']: {
            id: 0,
            ['callid']: [this.callid],
            ['sid']: [this.callid],
            ['source_ip']: [],
            ['pcap']: [this.agentPathPcap],
            ['__hep__']: [this.jsonData[this.callid].__hep__],
          }
        },
        transaction: {
          call: true,
          registration: false,
          rest: false,
        }
      },
      timestamp: {
        from: this.timestamp,
        to: this.timestamp,
      }
    };
  }
}
