import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { Functions } from '@app/helpers/functions';

@Component({
  selector: 'app-tab-logs',
  templateUrl: './tab-logs.component.html',
  styleUrls: ['./tab-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabLogsComponent implements OnInit, AfterViewInit {
    _data: any;

    get data() {
        return this._data;
    }
    @Input('data') set data(val) {
        if (!val) {
            return;
        }
        this._data = Functions.cloneObject(val);

        // Compact Objects
        this._data.forEach(i => {
            try {
                i.payload.raw = Functions.JSON_parse(i.payload.raw);
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
        this.cdr.detectChanges();
    }
    @Output() ready: EventEmitter<any> = new EventEmitter();
    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
    }
    ngAfterViewInit() {

        setTimeout(() => {
            this.ready.emit({});
        }, 100)
    }


}
