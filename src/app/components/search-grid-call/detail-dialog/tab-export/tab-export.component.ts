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

    constructor(
        private _ecs: ExportCallService,
        private searchService: SearchService,
        private sessionStorageService: SessionStorageService
    ) { }

    ngOnInit() { }

    private getQuery(): any {
        return this.searchService.queryBuilder_EXPORT(this.id, this.callid);
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

        const json = {
            query: (param ? (param.query ? param.query : param) : null) || this.searchService.getLocalStorageQuery(),
            datetime: this.sessionStorageService.getDateTimeRange()
        };
        const queryJson = encodeURIComponent(JSON.stringify(json)) + '=';
        const url = window.location.origin + window.location.pathname + '?' + queryJson;

        window.open(url, '_blank');
    }
}
