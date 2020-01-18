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
        this.decoded = null;

        if (this._data.decoded ) {
                if(this._data.decoded[0]) {
                    if (this._data.decoded[0]["_source"] && this._data.decoded[0]["_source"]["layers"]) {                                            
                        this.decoded = this._data.decoded[0]["_source"]["layers"];
                    } else {
                        this.decoded = this._data.decoded[0];
                    }
                } else {
                    this.decoded = this._data.decoded;
                }
        }
        //console.log('@Input ', this.decoded);
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
