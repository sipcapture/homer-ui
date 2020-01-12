import { Component, OnInit, Input } from '@angular/core';
import { ExportCallService } from '../../../../services/export/call.service';
import { DateTimeRangeService, DateTimeTick } from '../../../../services/data-time-range.service';
import { Functions } from '@app/helpers/functions';
import { ConstValue } from '@app/models';


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
        private _dtrs: DateTimeRangeService
    ) { }

    ngOnInit() {
    }

    queryBuilder () {
        const localData = JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY));
        // const protocol_profile = localData.map(i => i.profile)[0]; // 1_call | 1_default | 1_registration
        const search = {};
        search[localData.protocol_id] = {
            id: this.id,
            callid: [this.callid],
            uuid: []
        }
        return {
            timestamp: this._dtrs.getDatesForQuery(true),
            param: {
                search: search,
                location: {},
                transaction: {
                    call: localData.protocol_id === '1_call',
                    registration: localData.protocol_id === '1_registration',
                    rest: localData.protocol_id === '1_default'
                },
                id: {},
                timezone: {
                    value: -180,
                    name: 'Local'
                }
            }
        }
    }
    exportPCAP () {
        const request = this.queryBuilder();
        const subscription = this._ecs.postMessagesPcap(request).subscribe((data: any) => {
            subscription.unsubscribe();
            Functions.saveToFile(data, `export_${this.id}.pcap`);
        });
    }

    exportTEXT () {
        const request = this.queryBuilder();
        const subscription = this._ecs.postMessagesText(request).subscribe((data: any) => {
            subscription.unsubscribe();
            Functions.saveToFile(data, `export_${this.id}.txt`, 'text/plain;charset=utf-8');
        });
    }
}
