import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ExportCallService } from '../../../../services/export/call.service';
import { Functions } from '@app/helpers/functions';
import { SearchService } from '@app/services';


@Component({
  selector: 'app-tab-export',
  templateUrl: './tab-export.component.html',
  styleUrls: ['./tab-export.component.scss']
})
export class TabExportComponent implements OnInit {
    @Input() callid;
    @Input() id;
    @Input() dataItem: any;
    @Input() snapShotTimeRange: any;

    @Output() exportFlowAsPNG: EventEmitter<any> = new EventEmitter();
    constructor(
        private _ecs: ExportCallService,
        private searchService: SearchService
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
    private getDBNode() {
        const data = 
            this.dataItem && 
            this.dataItem.data && 
            this.dataItem.data.messages && 
            this.dataItem.data.messages[0] && 
            this.dataItem.data.messages[0].dbnode ? 
            this.dataItem.data.messages[0].dbnode : null;
        return data;
    }
    private getQuery(): any {
        const query = this.searchService.queryBuilder_EXPORT(this.id, this.getCallIdArray());
        query.timestamp = Functions.cloneObject(this.snapShotTimeRange);
        if( this.getDBNode() && query.param && query.param.location && query.param.location.node ) {
            query.param.location.node = [this.getDBNode()];
        }
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
        // const param = Functions.getUriJson();
        const json = this.getQuery();
        const queryJson = encodeURIComponent(JSON.stringify(json)) + '=';
        const url = window.location.origin + '/search/result?' + queryJson;

        window.open(url, '_blank');
    }
    onExportFlowAsPNG() {
        this.exportFlowAsPNG.emit({});
    }
}
