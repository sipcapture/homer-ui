import { Component, OnInit, Input } from '@angular/core';
import { AgentsubService, SearchService } from '@app/services';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-tab-hepsub',
    templateUrl: './tab-hepsub.component.html',
    styleUrls: ['./tab-hepsub.component.css']
})
export class TabHepsubComponent implements OnInit {
    @Input() dataItem: any;
    @Input() callid: any;
    @Input() id: any;
    @Input() snapShotTimeRange: any;

    subTabList = [];

    jsonData: any;

    constructor(
        private agentsubService: AgentsubService,
        private searchService: SearchService
    ) { }

    ngOnInit() {
        console.log(this.dataItem, this.callid, this.id);
        // this.agentsubService.getType('cdr').toPromise().then(data => {
        this.agentsubService.getType('cdr').toPromise().then(res => {
            console.log(`this.agentsubService.getType('cdr')`, {res});
            if (res && res.data ) {
                let {uuid, type} = res.data[0];
                this.subTabList = res.data;
                this.onTabClick(uuid, type); // open first TAB by default
            } else {
                console.log('error', res);
            }
        })

        // this.agentsubService.getType('json').toPromise().then(data => {
        //     console.log(`this.agentsubService.getType('json')`, {data});
        // })
    }
    onTabClick(uuid, type) {
        this.agentsubService.getHepsubElements({uuid, type, data: this.getQuery()}).toPromise().then(res2 => {
            console.log('res2', res2)
            if (res2 && res2.data) {
                this.jsonData = res2.data;
            }
        })
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
