import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-message-content',
    templateUrl: './message-content.component.html',
    styleUrls: ['./message-content.component.css']
})
export class MessageContentComponent implements OnInit {
    _data: any;
    raw;
    decoded: any = null;
    raw_isJSON = false;
    get data() {
        return this._data;
    }
    @Input('data') set data(val) {
        this._data = val;
        this.messageDetaiTableData = this._data.messageDetaiTableData;

        this.decoded = this._data.decoded ? this._data.decoded : null;
        if (this.decoded[0] && this.decoded[0]._source){ 
            this.decoded = this.decoded[0]._source.layers;
        }
        console.log('@Input ', this.decoded);

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
    }

    messageDetaiTableData: any;
    constructor() {

    }

    ngOnInit() { }

}
