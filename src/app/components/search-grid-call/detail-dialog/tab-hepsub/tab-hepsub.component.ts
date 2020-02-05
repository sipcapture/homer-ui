import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { AgentsubService, SearchService } from '@app/services';
import { Functions } from '@app/helpers/functions';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
    selector: 'app-tab-hepsub',
    templateUrl: './tab-hepsub.component.html',
    styleUrls: ['./tab-hepsub.component.css']
})
export class TabHepsubComponent implements OnInit, OnDestroy {
    @Input() id: any;
    @Input() callid: any;
    @Input() dataItem: any;
    @Input() dataLogs: Array<any>;
    @Input() snapShotTimeRange: any;
    @Output() haveData = new EventEmitter();

    @ViewChild('matTabGroup', {static: false}) matTabGroup: MatTabGroup;
    indexTabPosition = 0;
    
    isLogs = true;
    subTabList = [];
    jsonData: any;
    _interval: any;
    constructor(
        private agentsubService: AgentsubService,
        private searchService: SearchService
    ) { }

    ngOnInit() {
        this.agentsubService.getType('cdr').toPromise().then(res => {
            if (res && res.data ) {
                let {uuid, type} = res.data[0];
                this.subTabList = res.data.map(i => {
                    i.title = `"${i.node}"/ ${i.type}`;
                    return i;
                });
                this.onTabClick(uuid, type); // open first TAB by default
                this.indexTabPosition = 0;
                this.haveData.emit(true);
            } else {
                this.haveData.emit(false);
                console.log('error', res);
            }
        })
        setTimeout(() => {
            this.isLogs = this.dataLogs.length > 0;
        })
        this._interval = setInterval(() => {
            this.matTabGroup.realignInkBar();
        }, 350)
    }
    async onTabClick(uuid, type) {
        const res2 = await this.agentsubService.getHepsubElements({uuid, type, data: this.getQuery()}).toPromise();
        if (res2 && res2.data) {
            this.jsonData = res2.data;
            this.indexTabPosition = 0;
        }
    }
    getProfile() {
        return this.dataItem &&
            this.dataItem.data &&
            this.dataItem.data.messages &&
            this.dataItem.data.messages[0] && 
            this.dataItem.data.messages[0].profile ?
                this.dataItem.data.messages[0].profile : null;
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
        const query = this.searchService.queryBuilder_EXPORT(this.id, this.getCallIdArray(), this.getProfile());
        query.timestamp = Functions.cloneObject(this.snapShotTimeRange);
        return query;
    }
    ngOnDestroy () {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }
}
