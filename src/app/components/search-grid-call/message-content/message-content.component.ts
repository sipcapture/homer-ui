import { Component, OnInit, Input, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
    selector: 'app-message-content',
    templateUrl: './message-content.component.html',
    styleUrls: ['./message-content.component.scss']
})
export class MessageContentComponent implements OnInit, OnDestroy {
    _data: any;
    raw;
    decoded: any = null;
    raw_isJSON = false;
    private _interval: any;
    get data() {
        return this._data;
    }

    @ViewChild('matTabGroup', { static: false }) matTabGroup: MatTabGroup;

    @Input('data') set data(val) {
        this._data = val;
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
