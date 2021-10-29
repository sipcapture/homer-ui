import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { Functions } from '@app/helpers/functions';
import { MessageDetailsService, ArrowEventState } from '@app/services/message-details.service';

import { AfterViewInit, OnDestroy } from '@angular/core';
import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab-messages',
  templateUrl: './tab-messages.component.html',
  styleUrls: ['./tab-messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class TabMessagesComponent implements OnInit, AfterViewInit, OnDestroy {
  isWindow = false;
  messages: Array<any> = [];
  filterTextValue = '';
  channelIdMessageDetails: string;
  thisWindowId: string;
  dataSource: MatTableDataSource<Array<any>> = new MatTableDataSource([]);
  displayedColumns: string[] = [
    'id', 'create_date', 'timeSeconds', 'diff',
    'method', 'Msg_Size', 'srcAlias_srcPort', 'srcPort',
    'dstAlias_dstPort', 'dstPort', 'proto', 'type', 'ip_tos'/* , 'vlan' */
  ];
  filterData: any = {};
  @Input() set dataItem(_dataItem) {
    this.messages = _dataItem.data.messages.map(i => {
      const item = Functions.cloneObject(i.messageData);
      item.source_data = Functions.cloneObject(i);
      return item;
    });
    this.thisWindowId = _dataItem.data.callid.join('---');
    this.channelIdMessageDetails = 'TabMessages-' + _dataItem.data.callid.join();
    this.updateTableData(this.messages);
    this.cdr.detectChanges();
  }
  @Output() ready: EventEmitter<any> = new EventEmitter();


  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  filterSubscription: Subscription;
  constructor(
    private cdr: ChangeDetectorRef,
    private messageDetailsService: MessageDetailsService,
    private transactionFilterService: TransactionFilterService
  ) { }
  ngAfterViewInit() {
    window.requestAnimationFrame(() => {
      this.ready.emit({});
    });
  }
  updateTableData(messageData, filterData = null) {
    if (!filterData) {
      return;
    }
    // console.log({ message: messageData });
    try {
      this.dataSource = new MatTableDataSource(messageData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (data: any, filter: any) => {
        const { PayloadType, CallId, filterIP } = filter;
        const srcHost = data.item.srcHost || data.item.source_ip || data.item.sourceSipIP || data.item.srcAlias;
        const dstHost = data.item.dstHost || data.item.destination_ip || data.item.destinationSipIP || data.item.dstAlias;
        const sip = (filterIP?.find(i => i.title === srcHost)) || { selected: true };
        const dip = (filterIP?.find(i => i.title === dstHost)) || { selected: true };
        const bool = (sip.selected || dip.selected);

        const isPayloadType = PayloadType && PayloadType
          .find(i => data.type === i.title) || { selected: true };
        const isCallID = CallId && CallId.find(i => data.item.callid === i.title) || { selected: true };

        const boolFilterText = this.filterTextValue === '' ||
          Object.values(data)
            .filter(
              i => ['string', 'number'].includes(typeof i)
            )
            .join('$')
            .toLowerCase()
            .includes(
              this.filterTextValue.toLowerCase()
            );

        return isPayloadType && isPayloadType.selected && isCallID && isCallID.selected && boolFilterText && bool;
      };
      this.dataSource.filter = filterData;
      // console.log('this.dataSource', this.dataSource);
      this.cdr.detectChanges();
    } catch (err) { }
  }
  applyFilter() {
    this.dataSource.filter = this.filterData;
    this.cdr.detectChanges();
  }
  ngOnInit() {

    this.filterSubscription = this.transactionFilterService.listen.subscribe(filterData => {
      this.filterData = filterData;
      this.updateTableData(this.messages, filterData);
    });
    this.messageDetailsService.arrows.subscribe(data => {
      const { channelId } = data.metadata.data;
      let { itemId } = data.metadata.data;
      if (data && this.channelIdMessageDetails === channelId) {
        const arrData: Array<any> = this.dataSource.filteredData as Array<any>;
        switch (data.eventType) {
          case ArrowEventState.PREVIOUS:
            itemId--;
            break;
          case ArrowEventState.FOLLOWING:
            itemId++;
            break;
        }
        const itemData: any = arrData[itemId];

        this.onClickMessageRow(itemData, data.metadata.mouseEventData, {
          isLeft: !!arrData[itemId - 1],
          isRight: !!arrData[itemId + 1],
          itemId
        });
      }
    });
    this.updateTableData(this.messages);
  }
  identify(index, item) {
    return item.id;
  }
  onClickMessage(evt) {
    let id: any = evt?.data?.id;
    const event = evt.event || null;
    const row = evt?.data || null;
    // console.log({ id, event, row });

    // return;
    const arrData: Array<any> = this.dataSource.filteredData as Array<any>;
    if (row) {
      id = arrData.findIndex((item: any) => row.uniqueId === item.uniqueId);
    }
    const data: any = arrData[id];

    this.onClickMessageRow(data, {
      clientX: event && event.pageX,
      clientY: event && event.pageY,
    }, {
      isLeft: !!arrData[id - 1],
      isRight: !!arrData[id + 1],
      itemId: id
    });
  }
  onClickMessageRow(itemMessage: any, event = null, { isLeft = false, isRight = false, itemId = 0 }) {
    const item = itemMessage.source_data;
    let row: any;
    switch (item.typeItem) {
      case FlowItemType.SIP:
        row = item.messageData;
        break;
      case FlowItemType.RTP:
      case FlowItemType.RTCP:
        row = item.QOS;
        row.id = `(${item.typeItem}) ${item.info_date} ${item.description}`;
        row.raw = item.QOS.message;
        break;
      case FlowItemType.SDP:
        row = item.source_data;

        row.raw = [item.info_date, item.description, Object.assign({}, item.source_data)];
        row.id = `(SDP) ${item.info_date} ${item.description}`;
        break;
      case FlowItemType.DTMF:
        row = item.source_data;
        row.raw = [
          item.info_date,
          item.description,
          Object.assign({}, item.source_data.DTMFitem),
        ];
        row.id = `(DTMF) ${item.info_date} ${item.description}`;
        break;
      case FlowItemType.LOG:
      case 'HEP-LOG':
        row = item.source_data;
        row.raw = item.source_data?.item?.message;
        row.id = `(${item.typeItem}) ${item.description}`;
        break;
    }
    row.mouseEventData = event;
    this.messageDetailsService.open(row, {
      isLeft, isRight, itemId, channelId: this.channelIdMessageDetails,
      isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this.thisWindowId).isBrowserWindow
    });

  }
  isEllipsis(txt) {
    return txt?.length > 14 ? txt : '';
  }
  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }
}
