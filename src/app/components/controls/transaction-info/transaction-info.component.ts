import { Component, ChangeDetectorRef, Input, HostListener, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Functions } from '@app/helpers/functions';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core'
export interface CallIdData {
    callid: string;
    color: string;
    count: number;
    duration: string;
    methods: {};
}

@Component({
  selector: 'app-transaction-info',
  templateUrl: './transaction-info.component.html',
  styleUrls: ['./transaction-info.component.scss']
})

export class TransactionInfoComponent implements OnInit {

    isInfoOpened = false;
    methods: Array<string> = [];
    _sipDataItem;
    callIdList: Array<CallIdData> = [];
    _type = 'Flow';
    methodTotal = {};
    @Input('type') set type(val) {
        this._type = val || this._type;
    }

    @Input('dataItem')
    get dataItem() {
        return this._sipDataItem;
    }
    set dataItem(data) {
        if (!data ) {
            return;
        }
        this._sipDataItem = data;
        this._sipDataItem.metadata = { dataType: data.type };

        const {callid} = data.data;
        const methodsSet: Set<string> = new Set(this._sipDataItem?.data?.messages?.map(message => message.method));
        this.methods = this.methods.concat(Array.from(methodsSet.values()));
        this.methods.forEach(method  => {
            const color = Functions.getMethodColor(method);
            const methodObj = {
                count: this._sipDataItem?.data?.messages?.filter(message =>
                    message.method === method).length,
                color: color !== 'hsl(0,0%,0%)' ? color : 'transparent'
            };
            if (methodObj.count > 0) {
                this.methodTotal[method] = methodObj;
            }
        });
        this.callIdList = callid.map(id => {
                const duration = this._sipDataItem?.data?.data.transaction?.find(transaction => transaction.callid === id)?.duration;
                const formattedCallId: CallIdData = {
                    callid: id,
                    count: this._sipDataItem?.data?.messages?.filter(message => message.callid === id).length,
                    color: Functions.getColorByString(id),
                    duration: Functions.secondsToHour(duration),
                    methods: {}
                };
                this.methods.forEach(method  => {
                    const methodObj = {
                        count: this._sipDataItem?.data?.messages?.filter(message =>
                            message.method === method && message.callid === id).length,
                        color: Functions.getMethodColor(method),
                    };
                    if (methodObj.count > 0) {
                        formattedCallId.methods[method] = methodObj;
                    }
                });
                return formattedCallId;
            }
        );
        try {
            this.cdr.detectChanges();
        } catch (err) { }
    }

    @ViewChild('filterContainer', { static: false }) filterContainer: ElementRef;
    constructor(
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService
        ) {
            translateService.addLangs(['en'])
            translateService.setDefaultLang('en')
         }

    ngOnInit() {
    }
    openInfo() {
        if (this.isInfoOpened) {
            return;
        }
        setTimeout(() => {
            this.isInfoOpened = true;
            this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement: any) {
        if (this.filterContainer && this.filterContainer.nativeElement) {
            const clickedInside = this.filterContainer.nativeElement.contains(targetElement);
            if (!clickedInside && this.isInfoOpened) {
                this.hideInfo();
            }
        }
    }
    hideInfo() {
        this.isInfoOpened = false;
        this.cdr.detectChanges();
    }

}
