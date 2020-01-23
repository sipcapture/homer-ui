import { Component, OnInit, Input } from '@angular/core';
import { DateTimeRangeService } from '@app/services/data-time-range.service';
import { SearchRemoteService } from '@app/services';
import { Functions } from '@app/helpers/functions';
import { SearchService } from '@app/services';

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
    rxText: string;
    resultData: Array<any> = [];
    isFirstSearch = true;
    labels: Array<any> = [];
    constructor(
        private _srs: SearchRemoteService,
        private _dtrs: DateTimeRangeService,
        private searchService: SearchService
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
    async doSerchResult () {
        this.rxText = this.queryObject.rxText
        this.isFirstSearch = false;
        const data = await this._srs.getData(this.queryBuilder()).toPromise();

        this.resultData = data.data as Array<any>;
        this.resultData = this.resultData.map(i => {
            i.custom_1 = this.highlight(i.custom_1);
            return i;
        });
    }
    onUpdateData (event) {
        this.queryObject = event;
        this.queryObject.limit = 100;
    }
    queryBuilder() { /** depricated, need use {SearchService} */
        return {
            param: {
                server: this.queryObject.serverLoki, // 'http://127.0.0.1:3100',
                limit: this.queryObject.limit * 1,
                search: this.queryObject.text,
                timezone: this.searchService.getTimeZoneLocal()
            },
            timestamp: this._dtrs.getDatesForQuery(true)
        };
    }
    private highlight(value: string = ''): void {
        let data;
        if (!!this.rxText) {
            const rxText = this.rxText.replace(/\s/g, '');
            const regex = new RegExp('(' + rxText + ')', 'g');
            data = value
                .replace(/\</g, '&lt;')
                .replace(/\>/g, '&gt;')
                .replace(regex, (g, a) => {
                    return `<span>${a}</span>`;
                });
        } else {
            data = value || '';
        }
        return data;
    }
}
