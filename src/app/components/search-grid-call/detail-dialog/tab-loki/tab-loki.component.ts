import { Component, OnInit, Input } from '@angular/core';
import { DateTimeRangeService } from '@app/services/data-time-range.service';
import { SearchRemoteService } from '@app/services';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-tab-loki',
    templateUrl: './tab-loki.component.html',
    styleUrls: ['./tab-loki.component.css']
})
export class TabLokiComponent implements OnInit {
    @Input() id;
    @Input() dataItem: any;

    queryText: string;
    queryObject: any;
    resultData: Array<any> = [];
    isFirstSearch = true;
    labels: Array<any> = [];
    constructor(
        private _srs: SearchRemoteService,
        private _dtrs: DateTimeRangeService
    ) { }

    ngOnInit() {
        const data = this.dataItem.data;
        const labels = data.calldata.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []).join(' | ');

        this.queryText = `{job="heplify-server"} ${labels}`;
    }
    doSerchResult () {
        this.isFirstSearch = false;
        this._srs.getData(this.queryBuilder()).subscribe(data => {
            this.resultData = data.data as Array<any>;
        });
    }
    onUpdateData (event) {
        this.queryObject = event;
        this.queryObject.limit = 100;
    }
    queryBuilder() {
        return {
            param: {
                server: this.queryObject.serverLoki, // 'http://127.0.0.1:3100',
                limit: this.queryObject.limit * 1,
                search: this.queryObject.text,
                timezone: {
                    value: -120,
                    name: 'Local'
                }
            },
            timestamp: this._dtrs.getDatesForQuery(true)
        };
    }
}
