import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tab-logs',
  templateUrl: './tab-logs.component.html',
  styleUrls: ['./tab-logs.component.css']
})
export class TabLogsComponent implements OnInit {
    _data: any;

    get data() {
        return this._data;
    }
    @Input('data') set data(val) {
        this._data = JSON.parse(JSON.stringify(val));

        // Compact Objects
        this._data.forEach(i => {
            try {
                i.payload.raw = JSON.parse(i.payload.raw);
            } catch (e) { }

            try {
                i.payload = {
                    message: i.payload.raw,
                    timestamp: new Date(i.payload.create_date),
                    raw: i.payload
                };
                delete i.payload.raw.raw;
            } catch (e) { }
        });
    }
    constructor() { }

    ngOnInit() {
    }

}
