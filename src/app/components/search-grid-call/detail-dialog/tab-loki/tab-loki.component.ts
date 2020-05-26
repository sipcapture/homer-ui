import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectorRef, EventEmitter, ɵConsole } from '@angular/core';
import { DateTimeRangeService } from '@app/services/data-time-range.service';
import { SearchRemoteService } from '@app/services';
import { SearchService } from '@app/services';

@Component({
    selector: 'app-tab-loki',
    templateUrl: './tab-loki.component.html',
    styleUrls: ['./tab-loki.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class TabLokiComponent implements OnInit {
    @Input() id;
    @Input() dataItem: any;
    queryText: string;
    queryObject: any;
    rxText: string;
    showTime: true
    showTags: false
    showTs: true
    checked: boolean;
    resultData: Array<any> = [];
    isFirstSearch = true;
    labels: Array<any> = [];
    lokiLabels;
    dataSource: Array<any> = []
    constructor(
        private _srs: SearchRemoteService,
        private _dtrs: DateTimeRangeService,
        private searchService: SearchService,
        private cdr : ChangeDetectorRef
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
        this.cdr.detectChanges();
        
    }
    async doSerchResult () {
        this.rxText = this.queryObject.rxText;
        this.isFirstSearch = false;
        const data = await this._srs.getData(this.queryBuilder()).toPromise();

        this.resultData = data && data.data ? data.data as Array<any> : [];
        this.lokiLabels = this.resultData.map((l) => {
            l.custom_2 = this.labelsFormatter(l.custom_2);
            return l;
         })
        this.resultData = this.resultData.map((m) => {
            m.custom_1 = this.highlight(m.custom_1);
            return m;
        });
        console.log(this.resultData) // this will be the 
        this.cdr.detectChanges();
    }
    onUpdateData (event) {
        this.queryObject = event;
        this.queryObject.limit = 100;
        this.cdr.detectChanges();
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

    private labelsFormatter(rd) {
        let lokiLabels = JSON.parse(rd)
        return lokiLabels;
    }

    identify (index, item) {
        return item.micro_ts;
    }

    private highlight(value: string = '') {
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
