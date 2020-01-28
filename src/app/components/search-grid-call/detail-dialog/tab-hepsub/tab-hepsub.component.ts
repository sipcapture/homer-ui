import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AgentsubService, SearchService } from '@app/services';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-tab-hepsub',
    templateUrl: './tab-hepsub.component.html',
    styleUrls: ['./tab-hepsub.component.css']
})
export class TabHepsubComponent implements OnInit {
    @Input() id: any;
    @Input() callid: any;
    @Input() dataItem: any;
    @Input() dataLogs: Array<any>;
    @Input() snapShotTimeRange: any;
    @Output() haveData = new EventEmitter();
    isLogs = false;
    subTabList = [];
    jsonData: any;

    constructor(
        private agentsubService: AgentsubService,
        private searchService: SearchService
    ) { }

    ngOnInit() {
        this.agentsubService.getType('cdr').toPromise().then(res => {
            console.log(`this.agentsubService.getType('cdr')`, {res});
            if (res && res.data ) {
                let {uuid, type} = res.data[0];
                this.subTabList = res.data.map(i => {
                    i.title = `"${i.node}"/ ${i.type}`;
                    return i;
                });
                this.onTabClick(uuid, type); // open first TAB by default
                this.haveData.emit(true);
            } else {
                this.haveData.emit(false);
                console.log('error', res);
            }
        })
        setTimeout(() => {
            this.isLogs = this.dataLogs.length > 0;
        })
    }
    async onTabClick(uuid, type) {
        const res2 = await this.agentsubService.getHepsubElements({uuid, type, data: this.getQuery()}).toPromise();
        if (res2 && res2.data) {
            this.jsonData = res2.data;
        }
    }
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

}
