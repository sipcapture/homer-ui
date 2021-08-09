import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Timeline } from 'vis';
import { Functions } from '@app/helpers/functions';

import { MessageDetailsService, ArrowEventState } from '@app/services/message-details.service';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { TransactionFilterService } from '../../transaction-filter/transaction-filter.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'vis-timeline',
    templateUrl: './vistimeline.component.html',
    styleUrls: ['./vistimeline.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})

export class VistimelineComponent implements OnInit, OnDestroy {

    dataSource: any = {};
    _filters: any;
    id;
    @Input()
    set timelineData(val) {
        this.dataSource = val.data;
        this.channelIdMessageDetails = 'Vistimeline-' + this.dataSource.callid.join();
    }
    get timelineData(): any {
        return this.dataSource;
    }
    // @ViewChild('timelineContainer', { static: false }) timelineContainer: ElementRef;

    filterSubscription: Subscription;
    messageDetailsServiceSubscription: Subscription;
    timeline: any;
    data: any;
    options: any = {
        dataAttributes: ['message'],
        orientation: 'top',
        align: 'center',
        autoResize: true,
        editable: false,
        selectable: true,
        margin: 25,
        minHeight: '300px',
        template: this.getCardTamplate.bind(this),
        showCurrentTime: false,
        zoomMax: 31556926000
    };
    groups: any;
    channelIdMessageDetails: string;
    constructor(
        private messageDetailsService: MessageDetailsService,
        private cdr: ChangeDetectorRef
    ) {
        this.id = 'timelineContainer-' + (Math.round(Math.random() * 10000000));
    }
    ngOnInit() {
        this.filterSubscription = TransactionFilterService.listen.subscribe(filterData => {
            this._filters = filterData;
            this.getTimelineData();
        });

        this.messageDetailsServiceSubscription = this.messageDetailsService.arrows.subscribe(data => {
            let { channelId, itemId } = data.metadata.data;
            if (data && this.channelIdMessageDetails === channelId) {
                switch (data.eventType) {
                    case ArrowEventState.PREVIOUS:
                        itemId--;
                        break;
                    case ArrowEventState.FOLLOWING:
                        itemId++;
                        break;
                }
                const itemData: any = this.dataSource.messages[itemId];

                this.onClickMessageRow(itemData, null, {
                    isLeft: !!this.dataSource.messages[itemId - 1],
                    isRight: !!this.dataSource.messages[itemId + 1],
                    itemId
                });
            }
        });
    }
    private randie() {
        const { floor, random } = Math;
        const c = () => floor((256 - 229) * random()) + 230;
        return `rgb(${c()}, ${c()}, ${c()})`;
    }
    private mosColorBlink(mosNum: number) {
        console.log({mosNum})
        return mosNum >= 1 && mosNum <= 2 && 'red' ||
            mosNum === 3 && 'gray' ||
            mosNum <= 3 && 'orange' ||
            mosNum > 3 && 'green';
    }
    getCardTamplate(item, element, data) {
        const [color] = Functions.getColorByString(item.callid).match(/\d+/);
        const bgcolor = `hsl(${color}, 100%, 75%)`;
        const isRTP = item.content === FlowItemType.RTP || item.content === FlowItemType.RTCP;
        const MOSColor = isRTP ? this.mosColorBlink(item.QOS.MOS) : '';
        return `
            <div class="timeline-card">
                <div class="back-color" style="background-color: ${bgcolor};">
                    <div class="arrow" style="border-left-color: ${bgcolor};"></div>
                </div>
                <div class="header">${item.content}${isRTP && !item.isX_RTP ? `<big style="background-color: ${MOSColor};"></big>${item.QOS.MOS}` :
                (item.isX_RTP ? '(UAReport)' : '')
            }</div>
        </div>`;
    }
    getTimelineData() {
        if (!(this.dataSource && this.dataSource.messages)) {
            return;
        }

        const timelineHtmlContainer = document.getElementById(this.id);
        if (!timelineHtmlContainer) {
            setTimeout(() => {
                this.getTimelineData();
            }, 35);
            return;
        }

        

        let filteredData = this.dataSource.messages.map((item, key) => {
            item._index = key;
            return item;
        });

        if (this._filters) {
            const { CallId, PayloadType, filterIP } = this._filters;

            filteredData = this.dataSource.messages.filter(item => {
                const srcHost = item.srcHost || item.source_ip || item.sourceSipIP || item.srcAlias;
                const dstHost = item.dstHost || item.destination_ip || item.destinationSipIP || item.dstAlias;
                const _f = str => ((filterIP?.find(i => i.title === str)) || { selected: true }).selected;
                const ipFilter = _f(srcHost) && _f(dstHost);

                const itemFilter = (CallId?.find(i => i.title === item.callid)) || { selected: true };
                const payloadFilter = (PayloadType?.find(i => i.title === item.typeItem)) || { selected: true };
                return itemFilter.selected && payloadFilter.selected && ipFilter;
            });
        }

        this.groups = Functions.arrayUniques([].concat(
            ...filteredData
                .map(({ messageData }) => messageData)
                .map(i => [({
                    alias: (i.srcAlias || i.srcIp) + ':' + i.srcPort,
                    host: i.srcIp + ':' + i.srcPort,
                })])
        )).map((h: any) => ({
            id: h.host,
            content: h.alias,
            style: 'background-color:' + this.randie()
        }));

        this.data = filteredData.map((i, key) => {
            let itemHost = `${i.source_ip}:${i.source_port}`;
            let host = this.dataSource.hosts.find(h => h.host === itemHost);
            if (!host) {
                // IPv6 host
                itemHost = `[${i.source_ip}]:${i.source_port}`;
                host = this.dataSource.hosts.find(h => h.host === itemHost);
            }
            return {
                id: i._index,
                callid: i.callid,
                description: i.description,
                info_date: i.info_date,
                diff: i.diff,
                QOS: i.QOS,
                group: (host?.host + '').replace(/\[|\]/g, ''),
                content: i.method_text,
                start: i.micro_ts,
                source_data: i,
                isX_RTP: i.source_data?.QOS?.tabType === 'UAReport'
            };
        });
        if (!this.data) {
            this.data = [];
        }
        const timeArr = this.data.map(i => i?.source_data?.micro_ts || 0);
        const [minTime, maxTime] = [Math.min(...timeArr), Math.max(...timeArr)];
        const duration = maxTime - minTime;

        this.options.zoomMax = duration > 50 ? duration * 3 : 50;

        if (this.timeline?.destroy) {
            this.timeline?.destroy();
            timelineHtmlContainer.innerHTML = '';
            this.cdr.detectChanges();
        }

        const timeline = new Timeline(
            timelineHtmlContainer,
            this.data,
            this.groups,
            this.options
        );

        timeline.on('doubleClick', event => {
            const id = event.item;
            const data: any = this.dataSource.messages[id];

            this.onClickMessageRow(data, {
                clientX: event.pageX,
                clientY: event.pageY,
            }, {
                isLeft: !!this.dataSource.messages[id - 1],
                isRight: !!this.dataSource.messages[id + 1],
                itemId: id
            });
        });

        this.timeline = timeline;


        this.cdr.detectChanges();



    }

    onWheel(event: any): void {
        // Functions.emitWindowResize();
        if (this.timeline?.redraw) {
            this.timeline.redraw();
        }
    }

    onClickMessageRow(item: any, event = null, { isLeft = false, isRight = false, itemId = 0 }) {
        if (!item) {
            return;
        }
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
                row = item.source_data;
                row.raw = item.source_data?.item?.message;
                row.id = `(${item.typeItem}) ${item.description}`;
                break;
        }
        row.mouseEventData = event;

        this.messageDetailsService.open(row, {
            isLeft, isRight, itemId, channelId: this.channelIdMessageDetails,
            isBrowserWindow: !!this.messageDetailsService.getParentWindowData(this.dataSource.data.callid.join('---')).isBrowserWindow
        });
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        if (this.filterSubscription) {
            this.filterSubscription.unsubscribe();
        }
        if (this.messageDetailsServiceSubscription) {
            this.messageDetailsServiceSubscription.unsubscribe();
        }
        if (this.timeline) {
            delete this.timeline;
        }
    }
}
