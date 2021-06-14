import { Component, OnInit, Input, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import parsip from 'parsip';
import jwt_decode from 'jwt-decode';

@Component({
    selector: 'app-message-content',
    templateUrl: './message-content.component.html',
    styleUrls: ['./message-content.component.scss']
})
export class MessageContentComponent implements OnInit, OnDestroy {
    _data: any;
    raw;
    type;
    decoded: any = null;
    raw_isJSON = false;
    _sipData
    _sdpData
    _vqrData
    _xRTPData
    _JWTData
    get sipData() {
        return this._sipData;
    }
    set sipData(v) {
        this._sipData = v
    }

    get sdpData() {
        return this._sdpData
    }

    set sdpData(v) {
        this._sdpData = v
    }
    get vqrData() {
        return this._vqrData
    }
    set vqrData(v) {
        this._vqrData = v
    }
    get xRTPData() {
        return this._xRTPData
    }
    set xRTPData(v) {
        this._xRTPData = v
    }
    get JWTData() {
        return this._JWTData
    }
    set JWTData(v) {
        this._JWTData = v
    }
    private _interval: any;
    get data() {
        return this._data;
    }

    @ViewChild('matTabGroup', { static: false }) matTabGroup: MatTabGroup;

    @Input('data') set data(val) {
        this._data = val;

      /** parse SIP */if (val.raw) {
            this.sipData = (parsip.getSIP(val.raw));

            if ((this.sipData?.headers['Content-Type']?.[0]?.raw)?.toLowerCase() === 'application/sdp'
                && this.sipData?.body) {
                /**parse SDP  */
                this.sdpData = parsip.getSDP(this.sipData?.body);

            } if ((this.sipData?.headers['Content-Type']?.[0]?.raw)?.toLowerCase() === 'application/vq-rtcpxr') {
                /**parse vq */
                this.vqrData = parsip.getVQ(this.sipData?.body);
            } if (this.sipData?.headers['X-Rtp-Stat']?.[0]?.raw ||
                this.sipData?.headers[('X-Rtp-Stat').toLocaleLowerCase()]?.[0]?.raw) {
                /** parse x-rtp */
                this.xRTPData = parsip.getVQ(this.sipData?.headers['X-Rtp-Stat' || 'x-rtp-stat'][0].raw);

            } if (this.sipData?.headers?.['Identity']?.[0]?.raw || this.sipData?.headers?.['identity']?.[0]?.raw) {
                /** parse jwt */
                this.JWTData = jwt_decode(this.sipData?.headers?.Identity[0].raw) || jwt_decode(this.sipData?.headers?.identity[0].raw);

            }

        }

        this.type = val.type;
        this.messageDetailTableData = this._data.messageDetailTableData;
        this.decoded = null;

        if (this._data.decoded) {
            if (this._data.decoded[0]) {
                if (this._data.decoded[0]._source && this._data.decoded[0]._source.layers) {
                    this.decoded = this._data.decoded[0]._source.layers;
                } else {
                    this.decoded = this._data.decoded[0];
                }
            } else {
                this.decoded = this._data.decoded;
            }
        }

        this.raw = this._data.item.raw;

        if (typeof this.raw === 'string') {
            try {
                this.raw = JSON.parse(this.raw);
                this.raw_isJSON = true;
            } catch (e) {
                this.raw_isJSON = false;
            }
        } else {
            this.raw_isJSON = true;
        }
        this.changeDetectorRefs.detectChanges();
        setTimeout(() => {
            this.changeDetectorRefs.detectChanges();
        }, 35);
    }

    messageDetailTableData: any;
    constructor(private changeDetectorRefs: ChangeDetectorRef) { }

    ngOnInit() {
        this._interval = setInterval(() => {
            this.matTabGroup.realignInkBar();
            this.changeDetectorRefs.detectChanges();
        }, 350);
        this.changeDetectorRefs.detectChanges();
    }
    ngOnDestroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }
}
