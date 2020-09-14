import { Component, Input, Output, ViewChild, EventEmitter, } from "@angular/core";
import { Widget, WidgetArrayInstance } from "@app/helpers/widget";
import { IWidget } from "../IWidget";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { SettingPcapImportWidgetComponent } from "./setting-pcap-import-widget.component";
import { MatDialog } from "@angular/material/dialog";
import { DashboardService } from "@app/services";
import { Subscription, of } from "rxjs";
import { ConstValue } from "@app/models";
import { Functions } from "@app/helpers/functions";
import {
  HttpClient,
  HttpResponse,
  HttpRequest,
  HttpEventType,
  HttpErrorResponse,
} from "@angular/common/http";
import { catchError, last, map, tap } from "rxjs/operators";
import { PcapImportService } from "./pcap-import.service";

export class FileUploadModel {
  data: File;
  state: string;
  inProgress: boolean;
  progress: number;
  canRetry: boolean;
  canCancel: boolean;
  sub?: Subscription;
}

@Component({
  selector: "app-pcap-import",
  templateUrl: "./pcap-import-widget.component.html",
  styleUrls: ["./pcap-import-widget.component.scss"],
  animations: [
    trigger("fadeInOut", [
      state("in", style({ opacity: 100 })),
      transition("* => void", [animate(300, style({ opacity: 0 }))]),
    ]),
  ],
})
@Widget({
  title: "Import PCAP",
  description: "Import PCAP files into HOMER",
  category: "Import",
  indexName: "pcap-import",
  className: "PcapImportWidgetComponent", // <-- the same name as class name
})
export class PcapImportWidgetComponent implements IWidget {
  @Input() id: string;
  @Input() config: any;
  @Output() changeSettings = new EventEmitter<any>();
  /** Link text */
  @Input() text = "Import PCAP files";
  /** send HEP to server text */
  @Input() send_text = "Send HEP to server";
  /** Name used in form which will be sent in HTTP request. */
  @Input() param = "file";
  /** Target URL for file uploading. */

  @Input() accept = "pcap/*";
  /** Allow you to add handler after its completion. Bubble up response text from remote. */
  @Output() complete = new EventEmitter<string>();
  maxfileSize = 50000;

  vizHosts = ""; //etherframes.length
  vizFrames = ""; // ipv4hosts.length
  /* props of handleFileSelect */
  file;
  state = 0;
  fileposition = 0;
  ts_sec = 0;
  ts_usec = 0;
  ts_firstether = -1;
  frame = 0;
  ipv4hosts = [];
  etherpacket: any = {};
  etherframes = [];
  reader: FileReader = new FileReader();
  pcapws: "ws://0.0.0.0:6080/ws";

  /*end props of handleFileSelect */

  /* logging props */
  filesLog = {
    maxfileSize: 0,
    files: [],
    hosts: [],
    frames: 0,
    total: 0,
    success: 0,
    error: 0,
  };

  fileLog = {
    message: "",
    filename: "",
    fileSize: 0,
  };

  files = []; //Array<FileUploadModel> = [];

  title: any;
  subsDashboardEvent: Subscription;
  _lastTimeStamp = 0;
  set lastTimestamp(val: number) {
    this._lastTimeStamp = val;
  }
  get lastTimestamp() {
    return this._lastTimeStamp;
  }
  localData: any;

  constructor(
    public dialog: MatDialog,
    private _dashboardService: DashboardService,
    private _http: HttpClient,
    public _pcap: PcapImportService
  ) { }

  ngOnInit() {
   
    WidgetArrayInstance[this.id] = this as IWidget;
    this.config = {
      name: "pcap-import",
      config: this.config,
      pcapws: this.pcapws || "ws://0.0.0.0:9060",
    };
   
    this.pcapws = this.config.pcapws || this.pcapws;
    if (!this.config) {
      this.title = this.config.title || "PCAP IMPORT";
      this.pcapws = this.config.pcapws || this.pcapws;
    }
    this.subsDashboardEvent = this._dashboardService.dashboardEvent.subscribe(
      this.onDashboardEvent.bind(this)
    );
  }

  private async onDashboardEvent(data: any) {
    const dataId = data.resultWidget[this.id];
    if (dataId && dataId.query) {
      if (this.lastTimestamp * 1 === dataId.timestamp * 1) {
        return;
      }
      this.lastTimestamp = dataId.timestamp * 1;
      this.localData = dataId.query;
    }
  }

  errorHandler(evt): any {
    switch (evt.target.error) {
      case evt.target.error.NOT_FOUND_ERR:
        alert("File Not Found!");
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert("File is not readable");
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert("An error occurred reading this file.");
    }
  }

  fileAbortHandler(e): any {
    e.preventDefault();
    alert("File read cancelled");
  }
  toHex(d) {
    return ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
  }

  handleFileSelect(e) {
    let files = e.target["files"]; // FileList object

    this.reader.onload = (e) => this.fileProcessor(e);
    this.file = files[0];
    let blob = this.file.slice(this.fileposition, this.fileposition + 24);
    this.fileposition += 24;
    this.reader.readAsArrayBuffer(blob);
  }

  fileProcessor(e) {
    var data = e.currentTarget.result;
    switch (this.state) {
      case 0:
        var uint32array = new Uint32Array(data);

        if (2712847316 == uint32array[0]) {
         // console.log("Native byte order");
        } else if (3569595041 == uint32array[0]) {
         // console.log("Swapped byte order");
        } else if (2712812621 == uint32array[0]) {
         // console.log("Native byte order nano second timing");
        } else if (1295823521 == uint32array[0]) {
         // console.log("Swapped byte order nano second timing");
        }

        if (1 != uint32array[5]) {
         console.log("Link layer type not supported");
          return;
        }
       // console.log("LINKTYPE_ETHERNET");

        var blob = this.file.slice(this.fileposition, this.fileposition + 16);
        this.fileposition += 16;
        this.reader.readAsArrayBuffer(blob);
        this.state = 1;
        break;
      case 1:
        var uint32array = new Uint32Array(data);
        this.ts_sec = uint32array[0];
        this.ts_usec = uint32array[1];
        var incl_len = uint32array[2];
        var orig_len = uint32array[3];
        if (0 == incl_len) {
          var blob = this.file.slice(this.fileposition, this.fileposition + 16);
          this.fileposition += 16;
          this.reader.readAsArrayBuffer(blob);
          break;
        }
        var blob = this.file.slice(
          this.fileposition,
          this.fileposition + incl_len
        );
        this.fileposition += incl_len;
        this.reader.readAsArrayBuffer(blob);
        this.state = 2;
        break;
      case 2:
        var uint8array = new Uint8Array(data);
        var etherpacket: any = {};
        etherpacket.frame = this.frame;
        this.frame++;
        etherpacket.ts_sec = this.ts_sec + this.ts_usec / 1000000;
        if (-1 == this.ts_firstether) {
          this.ts_firstether = etherpacket.ts_sec;
        }
        etherpacket.ts_sec_offset =
          this.ts_sec + this.ts_usec / 1000000 - this.ts_firstether;
        // 0 - 5  = src //
        etherpacket.src =
          "" +
          this.toHex(uint8array[0]) +
          ":" +
          this.toHex(uint8array[1]) +
          ":" +
          this.toHex(uint8array[2]) +
          ":" +
          this.toHex(uint8array[3]) +
          ":" +
          this.toHex(uint8array[4]) +
          ":" +
          this.toHex(uint8array[5]);
        // 6 - 11 = dst //
        etherpacket.dst =
          "" +
          this.toHex(uint8array[6]) +
          ":" +
          this.toHex(uint8array[7]) +
          ":" +
          this.toHex(uint8array[8]) +
          ":" +
          this.toHex(uint8array[9]) +
          ":" +
          this.toHex(uint8array[10]) +
          ":" +
          this.toHex(uint8array[11]);
        // 12 - 13 = ethertype //
        etherpacket.ethertype =
          "" + this.toHex(uint8array[12]) + this.toHex(uint8array[13]);

        if (parseInt(etherpacket.ethertype, 16) > 1536) {
          switch (etherpacket.ethertype) {
            case "0800":
              /* IPV4 */
              etherpacket.ipv4 = {};
              etherpacket.ipv4.data = uint8array.slice(14, uint8array.length);
              etherpacket.ipv4.version = parseInt(
                this.toHex((etherpacket.ipv4.data[0] >> 4) & 0xf),
                16
              );
              etherpacket.ipv4.ihl = parseInt(
                this.toHex(etherpacket.ipv4.data[0] & 0xf),
                16
              );
              etherpacket.ipv4.dscp = this.toHex(
                (etherpacket.ipv4.data[1] >> 2) & 0x3f
              );
              etherpacket.ipv4.ecn = this.toHex(etherpacket.ipv4.data[1] & 0x3);
              etherpacket.ipv4.totallength = parseInt(
                this.toHex(etherpacket.ipv4.data[2]) +
                this.toHex(etherpacket.ipv4.data[3]),
                16
              );
              etherpacket.ipv4.identification = parseInt(
                this.toHex(etherpacket.ipv4.data[4]) +
                this.toHex(etherpacket.ipv4.data[5]),
                16
              );
              etherpacket.ipv4.flags = this.toHex(
                (etherpacket.ipv4.data[6] >> 5) & 7
              );
              etherpacket.ipv4.fragmentoffset =
                "" +
                this.toHex(etherpacket.ipv4.data[6] & 0x1f) +
                this.toHex(etherpacket.ipv4.data[7]);
              etherpacket.ipv4.ttl = etherpacket.ipv4.data[8];
              etherpacket.ipv4.protocol = etherpacket.ipv4.data[9];
              etherpacket.ipv4.checksum =
                "" +
                this.toHex(etherpacket.ipv4.data[10]) +
                this.toHex(etherpacket.ipv4.data[11]);
              etherpacket.ipv4.src =
                "" +
                etherpacket.ipv4.data[12] +
                "." +
                etherpacket.ipv4.data[13] +
                "." +
                etherpacket.ipv4.data[14] +
                "." +
                etherpacket.ipv4.data[15];
              etherpacket.ipv4.dst =
                "" +
                etherpacket.ipv4.data[16] +
                "." +
                etherpacket.ipv4.data[17] +
                "." +
                etherpacket.ipv4.data[18] +
                "." +
                etherpacket.ipv4.data[19];
              var hostid = -1;
              if (
                -1 == (hostid = this.ipv4hosts.indexOf(etherpacket.ipv4.src))
              ) {
                etherpacket.ipv4.srchostid = this.ipv4hosts.length;
                this.ipv4hosts.push(etherpacket.ipv4.src);
              } else {
                etherpacket.ipv4.srchostid = hostid;
              }
              if (
                -1 == (hostid = this.ipv4hosts.indexOf(etherpacket.ipv4.dst))
              ) {
                etherpacket.ipv4.dsthostid = this.ipv4hosts.length;
                this.ipv4hosts.push(etherpacket.ipv4.dst);
              } else {
                etherpacket.ipv4.dsthostid = hostid;
              }
              switch (etherpacket.ipv4.protocol) {
                case 17:
                  /* UDP */
                  etherpacket.ipv4.udp = {};
                  etherpacket.ipv4.udp.srcport = parseInt(
                    this.toHex(etherpacket.ipv4.data[20]) +
                    this.toHex(etherpacket.ipv4.data[21]),
                    16
                  );
                  etherpacket.ipv4.udp.dstport = parseInt(
                    this.toHex(etherpacket.ipv4.data[22]) +
                    this.toHex(etherpacket.ipv4.data[23]),
                    16
                  );
                  etherpacket.ipv4.udp.length = parseInt(
                    this.toHex(etherpacket.ipv4.data[24]) +
                    this.toHex(etherpacket.ipv4.data[25]),
                    16
                  );
                  etherpacket.ipv4.udp.checksum = parseInt(
                    this.toHex(etherpacket.ipv4.data[26]) +
                    this.toHex(etherpacket.ipv4.data[27]),
                    16
                  );
                  etherpacket.ipv4.udp.data = etherpacket.ipv4.data.slice(
                    28,
                    etherpacket.ipv4.data.length
                  );
                  break;
                case 6:
                  /* TCP */
                  etherpacket.ipv4.tcp = {};
                  etherpacket.ipv4.tcp.srcport = parseInt(
                    this.toHex(etherpacket.ipv4.data[20]) +
                    this.toHex(etherpacket.ipv4.data[21]),
                    16
                  );
                  etherpacket.ipv4.tcp.dstport = parseInt(
                    this.toHex(etherpacket.ipv4.data[22]) +
                    this.toHex(etherpacket.ipv4.data[23]),
                    16
                  );
                  etherpacket.ipv4.tcp.sequencenumber = parseInt(
                    this.toHex(etherpacket.ipv4.data[24]) +
                    this.toHex(etherpacket.ipv4.data[25]) +
                    this.toHex(etherpacket.ipv4.data[26]) +
                    this.toHex(etherpacket.ipv4.data[27]),
                    16
                  );
                  etherpacket.ipv4.tcp.acknowledgmentnumber = parseInt(
                    this.toHex(etherpacket.ipv4.data[28]) +
                    this.toHex(etherpacket.ipv4.data[29]) +
                    this.toHex(etherpacket.ipv4.data[30]) +
                    this.toHex(etherpacket.ipv4.data[31]),
                    16
                  );
                  etherpacket.ipv4.tcp.dataoffset =
                    (etherpacket.ipv4.data[32] >> 4) & 0xf;
                  etherpacket.ipv4.tcp.flags = {};
                  etherpacket.ipv4.tcp.flags.ns = etherpacket.ipv4.data[32] & 1;
                  etherpacket.ipv4.tcp.flags.cwr =
                    (etherpacket.ipv4.data[33] >> 7) & 1;
                  etherpacket.ipv4.tcp.flags.ece =
                    (etherpacket.ipv4.data[33] >> 6) & 1;
                  etherpacket.ipv4.tcp.flags.urg =
                    (etherpacket.ipv4.data[33] >> 5) & 1;
                  etherpacket.ipv4.tcp.flags.ack =
                    (etherpacket.ipv4.data[33] >> 4) & 1;
                  etherpacket.ipv4.tcp.flags.psh =
                    (etherpacket.ipv4.data[33] >> 3) & 1;
                  etherpacket.ipv4.tcp.flags.rst =
                    (etherpacket.ipv4.data[33] >> 2) & 1;
                  etherpacket.ipv4.tcp.flags.syn =
                    (etherpacket.ipv4.data[33] >> 1) & 1;
                  etherpacket.ipv4.tcp.flags.fin =
                    etherpacket.ipv4.data[33] & 1;
                  etherpacket.ipv4.tcp.windowsize = parseInt(
                    this.toHex(etherpacket.ipv4.data[34]) +
                    this.toHex(etherpacket.ipv4.data[35]),
                    16
                  );
                  etherpacket.ipv4.tcp.checksum = parseInt(
                    this.toHex(etherpacket.ipv4.data[36]) +
                    this.toHex(etherpacket.ipv4.data[37]),
                    16
                  );
                  etherpacket.ipv4.tcp.urgentpointer = parseInt(
                    this.toHex(etherpacket.ipv4.data[38]) +
                    this.toHex(etherpacket.ipv4.data[39]),
                    16
                  );
                  etherpacket.ipv4.tcp.data = etherpacket.ipv4.data.slice(
                    20 + etherpacket.ipv4.tcp.dataoffset * 4,
                    etherpacket.ipv4.data.length
                  );
                  break;
              }
              break;
            case "86DD":
              /* IPV6 */
              break;
            case "0806":
              /* ARP */
              break;
            case "9100":
              /* VLAN tagged */
              break;
          }
        } else {
          // We probbaly won't need this as is raw length.
        }
        // here can return the etherframes to push
        this.etherframes.push(etherpacket);
        if (this.etherframes.length > 100) {
          // send the parsed data to view
          //drawGraph( etherframes, ipv4hosts );
          this.sendBufferData(this.etherframes, this.ipv4hosts);
          return;
        }
        var blob = this.file.slice(this.fileposition, this.fileposition + 16);
        this.fileposition += 16;
        if (this.fileposition > this.file.size) {
          // send the parsed data to view send the frames and the hosts count if it's less than 100
          //  drawGraph( etherframes, ipv4hosts );
          this.sendBufferData(this.etherframes, this.ipv4hosts);
          return;
        }
        this.reader.readAsArrayBuffer(blob);
        this.state = 1;
        break;
    }
  }

  // drawGraph function
  sendBufferData(frames, hosts) {
    this.filesLog.frames = frames.length;
    if (frames.length > 99) {
      this.filesLog.hosts = [];
    }
    this.filesLog.hosts.push(hosts);
  }

  sendHep() {
    this._pcap.processFrames(this.etherframes, this.pcapws);
  }
  /**   end pcap methods */

  onClick() {
    const fileUpload = document.getElementById(
      "fileUpload"
    ) as HTMLInputElement;
    fileUpload.onchange = (e) => {
      this.handleFileSelect(e);

      this.filesLog.maxfileSize = this.maxfileSize;
      for (let index = 0; index < fileUpload.files.length; index++) {
        const file = fileUpload.files[index];
        const log = { ...this.fileLog };
        log.filename = file.name;
        log.fileSize = file.size;
        // @ TODO: integrate error / log handlers
        if (this.maxfileSize === 0 || file.size <= this.maxfileSize) {
          log.message = "success";
          this.filesLog.success += 1;
          this.files.push({
            data: file,
            state: "in",
            inProgress: false,
            progress: 0,
            canRetry: false,
            canCancel: true,
          });
        } else {
          log.message = "error";
          this.filesLog.error += 1;
        }
        this.filesLog.files.push(log);
    
        this.filesLog.total += 1;
      }

  
    };
    fileUpload.click();
  }

  /** end upload methods */

  private saveConfig() {
    const _f = Functions.cloneObject;
    this.config = {
      title: this.title || this.id,
      pcapws: this.pcapws,
    };

    this.changeSettings.emit({
      config: _f(this.config),
      id: this.id,
      pcapws: this.pcapws,
    });
  }

  async openDialog() {
    const dialogRef = this.dialog.open(SettingPcapImportWidgetComponent, {
      data: {
        title: this.title || this.id,
        pcapws: this.config.pcapws || this.pcapws,
      },
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) {
      return;
    }
    this.title = result.title;
    this.pcapws = result.pcapws;

    this.saveConfig();
  }

  ngOnDestroy() {
    this.subsDashboardEvent.unsubscribe();
  }
}
