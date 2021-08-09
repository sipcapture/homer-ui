import { GridOptions } from 'ag-grid-community';
import {
    Component,
    OnInit,
    Input,
    EventEmitter,
    Output,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    AfterViewChecked,
    AfterViewInit
} from '@angular/core';
import { Functions } from 'src/app/helpers/functions';
import {
    MessageDetailsService,
    ArrowEventState
} from '@app/services/message-details.service';

@Component({
    selector: 'app-tab-tdr',
    templateUrl: './tab-tdr.component.html',
    styleUrls: ['./tab-tdr.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabTdrComponent implements OnInit, AfterViewInit {
    agGridSizeControl = {
        selectedType: 'sizeToFit',
        pageSize: 100
    };
    agColumnDefs: any[] = [];
    details = [];
    gridOptions: GridOptions = <GridOptions>{
        defaultColDef: {
            sortable: true,
            resizable: true,
        },
        rowHeight: 38,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        // getRowStyle: this.getBkgColorTable.bind(this),
        // getRowStyle: params => {
        //     if (params.node.rowIndex % 2 === 0) {
        //         return { background: 'red' };
        //     }
        // },

        suppressCellSelection: true,
        suppressPaginationPanel: true
    };
    columns = [
        'id',
        // 'anumber_ext',
        // 'auth_user',
        // 'bnumber_ext',
        'callid',
        // 'capt_id',
        'cdr_connect',
        // 'cdr_progress',
        // 'cdr_ringing',
        // 'cdr_rinv',
        // 'cdr_rinva',
        'cdr_start',
        'cdr_stop',
        'destination_ip',
        'destination_port',
        'duration',
        'from_user',
        'ipgroup_in',
        'ipgroup_out',
        'mos',
        'ruri_user',
        'source_ip',
        'source_port',
        'to_user',
        'usergroup'
    ];
    isMessage = false;
    messageData: any;
    _dataItem: any;
    channelIdMessageDetails: string;
    @Output() ready: EventEmitter<any> = new EventEmitter();
    @Input() set dataItem(_dataItem) {
        this._dataItem = _dataItem;
        const CallTransactionData = _dataItem.data.data;
        const tdrData = Functions.cloneObject(CallTransactionData.transaction);
        this.channelIdMessageDetails = 'TabTDR-' + _dataItem.data.data.callid.join();
        tdrData.forEach((i, id) => {
            i.id = i.id || (id + 1);
            if (i.duration) {
                const t = new Date(i.duration * 1000);
                i.duration = [t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds()]
                    .map(i => (i + '').length === 1 ? '0' + i : i).join(':');
            }
        });
        // this.columns.find(i => i === 'du')
        this.details = Functions.cloneObject(tdrData);
        // console.log('TDR:data', this.details);
        setTimeout(() => {
            this.gridOptions.api?.sizeColumnsToFit();
            this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
    }
    constructor(
        private messageDetailsService: MessageDetailsService,
        private cdr: ChangeDetectorRef
    ) {
        this.agColumnDefs = this.columns.map(i => ({ field: i }));
    }
    ngAfterViewInit() {

        setTimeout(() => {
            this.ready.emit({});
        }, 35)
    }

    ngOnInit() {
        this.messageDetailsService.arrows.subscribe(data => {
            let { channelId, itemId } = data.metadata.data;
            if (data && this.channelIdMessageDetails === channelId) {
                // const id = event.item;
                switch (data.eventType) {
                    case ArrowEventState.PREVIOUS:
                        itemId--;
                        break;
                    case ArrowEventState.FOLLOWING:
                        itemId++;
                        break;
                }
                const itemData: any = this.details[itemId];
                this.onClickMessageRow(itemData, null, {
                    isLeft: !!this.details[itemId - 1],
                    isRight: !!this.details[itemId + 1],
                    itemId
                });
                this.cdr.detectChanges();
            }
        });
    }
    showMessage(eventData: any) {
        console.log('click message', { eventData });
        // return;
        const { event } = eventData || { event: null };
        const { id: indexItem } = eventData?.node || {};
        if (!indexItem) {
            return;
        }
        const itemData: any = this.details[indexItem];
        this.onClickMessageRow(itemData, event, {
            isLeft: !!this.details[indexItem - 1],
            isRight: !!this.details[indexItem + 1],
            itemId: indexItem
        });
    }

    onClickMessageRow(row: any, event = null, { isLeft = false, isRight = false, itemId = 0 }) {
        const data = Functions.cloneObject(row);
        data.mouseEventData = event;
        this.messageDetailsService.open(data, {
            isLeft, isRight, itemId, channelId: this.channelIdMessageDetails,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this._dataItem.data.callid.join('---')).isBrowserWindow
        });
        this.cdr.detectChanges();
    }

    public getRowStyle(params) {
        console.log('getRowStyle(params)', params)
        const _style: any = {
            'border-bottom': '1px solid rgba(0,0,0,0.1)',
            'cursor': 'pointer'
        }
        if (params.node.rowIndex % 2 === 0) {
            _style.background = '#e4f0ec';
        }
        return _style;
    };
    sortChanged(event) {
        this.cdr.detectChanges();
    }

}
