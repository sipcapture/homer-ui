import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
import { AgentsubService, SearchService } from '@app/services';
import { Functions } from '@app/helpers/functions';
import { MatTabGroup } from '@angular/material/tabs';
import { PreferenceHepsubService } from '@app/services/preferences/index';

@Component({
    selector: 'app-tab-hepsub',
    templateUrl: './tab-hepsub.component.html',
    styleUrls: ['./tab-hepsub.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabHepsubComponent implements OnInit, OnDestroy {
    @Input() id: any;
    @Input() callid: any;
    @Input() dataItem: any;
    @Input() dataLogs: Array<any>;
    @Input() snapShotTimeRange: any;
    @Output() haveData = new EventEmitter();

    @ViewChild('matTabGroup', { static: false }) matTabGroup: MatTabGroup;
    indexTabPosition = 0;

    isLogs = true;
    subTabList = [];
    downloadArray = {};
    downloadKey = {};
    isDownload = false;
    jsonData: any;
    jsonDownload: any;
    _interval: any;
    objectKeys = Object.keys
    constructor(
        private agentsubService: AgentsubService,
        private searchService: SearchService,
        private cdr: ChangeDetectorRef,
        private _phs: PreferenceHepsubService
    ) { }

    ngOnInit() {

        try {

            const data = this.getQuery();
            if (data.param && data.param.search) {
                const key = Object.keys(data.param.search);
                const response = this._phs.getAll().toPromise().then(res => {
                    const that = this;
                    if (res && res['data']) {
                        res['data'].forEach(function (value) {

                            const valKey = value['hepid'] + '_' + value['profile'];
                            if (valKey == key[0]) {
                                that.getData(value.mapping);
                                return;
                            }
                        });
                    }
                });
            }
        } catch (err) {
            console.log('error request:', err);
        }

        setTimeout(() => {
            this.isLogs = this.dataLogs.length > 0;
            this.cdr.detectChanges();
        });
        this._interval = setInterval(() => {
            this.matTabGroup.realignInkBar();
            this.cdr.detectChanges();
        }, 350);
    }

    getData(mapping) {

        this.agentsubService.getType(mapping['lookup_profile']).toPromise().then(res => {
            if (res && res.data) {
                const type = mapping['lookup_profile'];
                const { uuid } = res.data[0];
                this.subTabList = res.data.map(i => {
                    i.title = `"${i.node}"/ ${type}`;
                    return i;
                });
                this.onTabClick(uuid, type, mapping); // open first TAB by default
                this.indexTabPosition = 0;
                this.haveData.emit(true);
            } else {
                this.haveData.emit(false);
            }
            this.cdr.detectChanges();
        });
    }

    async onTabClick(uuid, type, mapping) {

        const dataQuery = this.getQuery();
        const profile = this.getProfile();

        if (mapping['source_fields']) {

            const obj = mapping['source_fields'];
             for (const key of Object.keys(obj)) {
                let splitted = obj[key].split('.', 2);
                if (splitted[1]) {
                    if (splitted[0] == 'data_header') {
                        const newData = this.getMyDataArray(splitted[1]);
                        dataQuery['param']['search'][profile][key] = newData;
                    } else if (splitted[0] == 'message') {
                        const newData = this.getMyMessagesArray(splitted[1]);
                        dataQuery['param']['search'][profile][key] = newData;
                    }
                }
            }
        } else if (mapping['source_field']) {

            const splitted = mapping['source_field'].split('.', 2);
            if (splitted[1]) {
                if (splitted[0] == 'data_header') {
                    const newData = this.getMyDataArray(splitted[1]);
                    dataQuery['param']['search'][profile][splitted[1]] = newData;
                } else if (splitted[0] == 'message') {
                    const newData = this.getMyMessagesArray(splitted[1]);
                    dataQuery['param']['search'][profile][splitted[1]] = newData;
                }
            }
        }
        const res2 = await this.agentsubService.getHepsubElements({ uuid, type, data: dataQuery }).toPromise();
        if (res2 && res2.data) {

            const hepData = (JSON.parse(JSON.stringify(res2.data)));
            const downloadJSON = {};

            for (let key of Object.keys(hepData)) {
                for (const skey in hepData[key]) {
                    if (skey.startsWith("__")) {
                        if (skey == '__hep__' && hepData[key][skey]['type'] && hepData[key][skey]['type'] == "download") {
                            const newObj = JSON.parse(JSON.stringify(hepData[key]));
                            if(!this.downloadKey[newObj.cid]) {
                                this.downloadArray[newObj.cid] = newObj;
                                this.downloadKey[newObj.cid] = uuid;
                            }
                        }

                        delete hepData[key][skey];
                        downloadJSON[key] = (JSON.parse(JSON.stringify(hepData[key])));
                        delete hepData[key];
                        this.isDownload = true;
                    }
                }
            }

            this.jsonDownload = downloadJSON;
            this.jsonData = hepData;
            this.jsonData.data = JSON.parse(this.jsonData?.data)
            this.indexTabPosition = 0;
            this.cdr.detectChanges();
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

    public downloadData(data) {
        try {
            const dataQuery = this.getQuery();
            const uuid = this.downloadKey[data.cid];
            if (dataQuery.param && dataQuery.param.search) {
                dataQuery.param.search[this.getProfile()] = data;
                const response = this.agentsubService.getHepsubBlobData({ uuid, data: dataQuery }).toPromise().then(res => {
                    Functions.saveToFile(res, `export_${uuid}.pcap`);
                });
            }
        } catch (err) {
            console.log('error request:', err);
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
        return callidArray || [];
    }

    private getMyDataArray(key) {
        const data = this.dataItem.data;
        const myArray = data.calldata.map(i => i[key]).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);
        return myArray;
    }

    private getMyMessagesArray(key) {
        const data = this.dataItem.data;
        const myArray = data.messages.map(i => i[key]).reduce((a, b) => {
            if (a.indexOf(b) === -1) {
                a.push(b);
            }
            return a;
        }, []);
        return myArray;
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
        const query = this.searchService.queryBuilder_EXPORT(this.id, this.getCallIdArray(), this.getProfile());
        query.timestamp = Functions.cloneObject(this.snapShotTimeRange);
        if (this.getDBNode() && query.param && query.param.location && query.param.location.node) {
            query.param.location.node = [this.getDBNode()];
        }
        return query;
    }
    ngOnDestroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }
}
