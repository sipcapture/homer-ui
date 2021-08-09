import { Functions } from '@app/helpers/functions';
import { Component, OnInit, Input, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, AfterContentInit } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import * as _moment from 'moment';
import * as _parsip from 'parsip';

import jwt_decode from 'jwt-decode';
import { AlertService } from '@app/services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat, TimeFormattingService } from '@app/services/time-formatting.service';
import { CopyService } from '@app/services/copy.service';

const parsip = _parsip;
const moment = _moment;
@Component({
    selector: 'app-message-content',
    templateUrl: './message-content.component.html',
    styleUrls: ['./message-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageContentComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit {
    _data: any;
    dateFormat: DateFormat;
    timeLabel: string;
    raw;
    type;
    raw_isJSON = false;
    labelList = {};
    copyData;
    private _interval: any;
    _pt: any;
    tableObj = {};
    get data() {
        return this._data;
    }
    get pt(): any {
        return this._pt;
    }
    set pt(v: any) {
        this._pt = v;
    }


    @ViewChild('matTabGroup', { static: false }) matTabGroup: MatTabGroup;
    @Input() rowData: any;
    @Input('data') set data(val) {

        this._data = val;
        console.log('this._data', this._data);
        if (val.frame_protocol) {
            // is web-shark

            return;
        }
        this.type = val.type || '';
        /** parse tabs */
        try {
            if (this._data?.raw_source) {
                this.pt = {};

                /** parse SIP */
                this.pt.sip = _parsip.getSIP(this._data.raw_source);
                const sipData: any = { ...this.pt.sip };
                if ((sipData?.headers?.['Content-Type']?.[0]?.raw)?.toLowerCase() === 'application/sdp'
                    && sipData?.body) {
                    /**parse SDP  */
                    this.pt.sdp = parsip.getSDP(sipData?.body);

                } if ((sipData?.headers?.['Content-Type']?.[0]?.raw)?.toLowerCase() === 'application/vq-rtcpxr') {
                    /**parse vq */
                    this.pt.vqr = parsip.getVQ(sipData?.body);
                } if (sipData?.headers?.['X-Rtp-Stat']?.[0]?.raw ||
                    sipData?.headers?.[('X-Rtp-Stat').toLocaleLowerCase()]?.[0]?.raw) {
                    /** parse x-rtp */
                    this.pt.xrtp = parsip.getVQ(sipData?.headers['X-Rtp-Stat' || 'x-rtp-stat'][0].raw);

                } if (sipData?.headers?.Identity?.[0]?.raw) {
                    /** parse jwt */
                    this.pt.jwt = jwt_decode(sipData?.headers?.Identity[0].raw);

                }
            }

        } catch (e) {
            console.log(e);
        }

        this.messageDetailTableData = this._data.messageDetailTableData;
        this.tableObj = this.messageDetailTableData.reduce((p, a) => {
            return ({ ...p, [a.name]: a.value });
        }, {});

        try {
            const { create_ts, srcId, dstId } = this._data;

            this._tfs.getFormat().then((res: DateFormat) => {
                this.dateFormat = res;
                if (srcId && dstId) {
                    this.timeLabel = `${moment(create_ts).format(this.dateFormat.dateTimeMsZ)}: ${srcId} -> ${dstId}`;
                } else {
                    if (this._data?.id?.replace) {
                        this.timeLabel = this._data?.id?.replace(/\(.*\]\s?/g, '');
                    }
                }
            });
        } catch (e) { }

        this.raw = this._data.item.raw;

        if (this._data.tabType === 'UAReport') {
            // the parcing for RTP User Agent packets
            try {
                if (!this.raw.match(';')) {
                    this.raw = this.raw.split(',').reduce((a, b) => {
                        const [k, v] = b.split('=');
                        a[k] = v;
                        return a;
                    }, {});
                } else {
                    this.raw = this.raw.split(';').reduce((a, b) => {
                        const [key, v] = b.split('=');
                        a[key] = v.match(',') ? v.split(',') : v;
                        return a;
                    }, {});
                }
            } catch (_) { }
        }

        if (typeof this.raw === 'string') {
            this.raw = Functions.JSON_parse(this.raw) || Functions.JSON_parse(this._data.raw_source) || this.raw;
        }
        this.copyData = typeof this.data.raw_source !== 'undefined' ? this.data.raw_source : JSON.stringify(this.data.raw);
        this.raw_isJSON = typeof this.raw !== 'string';

        // console.log('this.raw, this.raw_isJSON', this.raw, this.raw_isJSON, JSON.parse(this.raw));
        this.cdr.detectChanges();
    }

    messageDetailTableData: any;

    constructor(
        private cdr: ChangeDetectorRef,
        private _tfs: TimeFormattingService,
        public alertService: AlertService,
        public translateService: TranslateService,
        private copyService: CopyService

    ) { }

    identify(index, item) {
        return item.name;
    }
    isParsedData(item) {
        return this.pt.hasOwnProperty(item);
    }
    isObject(item) {
        return typeof item === 'object';
    }
    ngOnInit() {
        this._interval = setInterval(() => {
            this.matTabGroup?.realignInkBar();
        }, 2000);

    }
    ngAfterViewInit() {
        this.matTabGroup?.realignInkBar();
        this.cdr.detectChanges();
    }
    ngAfterContentInit() {
        this.matTabGroup?.realignInkBar();
        this.cdr.detectChanges();
    }
    ngOnDestroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }

    copy(rawData, isObject = false) {
        this.translateService.get('notifications.success.messageCopy').subscribe(alert => {
            console.log(alert);
            if (this.raw_isJSON || isObject) {
                const message = JSON.stringify(rawData, null, 4);
                this.copyService.copy(message, alert);

            } else {
                this.copyService.copy(this.copyData, alert);
            }
        });


    }
    onSelectedTab() {
        const tabs = this.matTabGroup._tabs['_results'].reduce((a, b) => {
            return { ...a, [b.isActive]: b.textLabel };
        }, {});
        const actualTab = tabs['true'];
        const rawAsJSON = this.data.raw_source && Functions.JSON_parse(this.data.raw_source) || this.data.raw_source;
        console.log('rawAsJSON', rawAsJSON);
        const tabsInfo = {
            Message: typeof this.data.raw_source !== 'undefined' ? this.data.raw_source : this.objString(this.data.raw),
            SIP: this.objString(this.pt?.sip),
            SDP: this.objString(this.pt?.sdp),
            Decoded: this.objString(this._data.decoded),
            Details: this.objString(this.tableObj),
            XRTP: this.objString(this.pt?.xrtp),
            JWT: this.objString(this.pt?.jwt),
            VQR: this.objString(this.pt?.vqr),

        };

        this.copyData = tabsInfo[actualTab];

    }
    objString(s) {
        return JSON.stringify(s, null, 4);
    }

}

