import { Component, OnInit, Input } from '@angular/core';
import { ExportCallService } from '../../../../services/export/call.service';
import { Functions } from '@app/helpers/functions';
import { SearchService, SessionStorageService } from '@app/services';


@Component({
  selector: 'app-tab-export',
  templateUrl: './tab-export.component.html',
  styleUrls: ['./tab-export.component.css']
})
export class TabExportComponent implements OnInit {
    @Input() callid;
    @Input() id;
    @Input() dataItem: any;
    @Input() snapShotTimeRange: any;

    constructor(
        private _ecs: ExportCallService,
        private searchService: SearchService,
        private sessionStorageService: SessionStorageService
    ) { }

    ngOnInit() { }
    private getCallIdArray() {
        const data = this.dataItem.data;
        const callidArray = data.calldata.map(i => i.sid).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);
        return callidArray;
    }
    private getQuery(): any {
        const query = this.searchService.queryBuilder_EXPORT(this.id, this.getCallIdArray());
        query.timestamp = Functions.cloneObject(this.snapShotTimeRange);
        return query;
    }

    async exportPCAP () {
        const data = await this._ecs.postMessagesPcap(this.getQuery()).toPromise();
        Functions.saveToFile(data, `export_${this.id}.pcap`);
    }

    async exportTEXT () {
        const data = await this._ecs.postMessagesText(this.getQuery()).toPromise();
        Functions.saveToFile(data, `export_${this.id}.txt`, 'text/plain;charset=utf-8');
    }
    onShareLink () {
        const param = Functions.getUriJson();
        const format = d => new Date(d).toLocaleString().split(',').map(i => i.replace(/\./g, '/')).join('');
        const json = {
            query: (param ? (param.query ? param.query : param) : null) || this.searchService.getLocalStorageQuery(),
            datetime: {
                title: [
                    format(this.snapShotTimeRange.from),
                    format(this.snapShotTimeRange.to)
                ].join(' - '),
                dates: [
                    new Date(this.snapShotTimeRange.from).toISOString(),
                    new Date(this.snapShotTimeRange.to).toISOString()
                ]
             }
        };
        const queryJson = encodeURIComponent(JSON.stringify(json)) + '=';
        const url = window.location.origin + '/call/result/?' + queryJson;

        window.open(url, '_blank');
    }
}
