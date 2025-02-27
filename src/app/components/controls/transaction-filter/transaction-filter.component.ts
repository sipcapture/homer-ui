import { ConstValue, UserConstValue } from '@app/models/const-value.model';
import {
    Component,
    ChangeDetectorRef,
    Input,
    HostListener,
    ViewChild,
    ElementRef,
    OnInit,
} from '@angular/core';
import { FlowItemType } from '@app/models/flow-item-type.model';
import { Functions, setStorage } from '@app/helpers/functions';
import { TransactionFilterService } from './transaction-filter.service';
import { CallIDColor } from '@app/models/CallIDColor.model';
import { AlertMessage, AlertService, PreferenceAdvancedService } from '@app/services';
import { lastValueFrom, BehaviorSubject, Subscription } from 'rxjs';
import { CallCaptureIdConsolidationService } from '@app/services/call/consolidation.service';

interface FilterItem {
    title: string;
    selected: boolean;
    color?: string;
}
export interface FlowFilter {
    isSimplify: boolean;
    isConsolidateCaptureIds: boolean;
    consolidationTimeThreshold: number;
    isSimplifyPort: boolean;
    isCombineByAlias: boolean;
    PayloadType: Array<FilterItem>;
    filterIP: Array<FilterItem>;
    filterAlias: Array<FilterItem>;
    CallId: Array<FilterItem>;
}
@Component({
    selector: 'app-filter',
    templateUrl: './transaction-filter.component.html',
    styleUrls: ['./transaction-filter.component.scss'],
})
export class TransactionFilterComponent implements OnInit {
    flowFilters;
    isAdvancedDefaultFilter = false;
    filterSettings: any = {};

    isSimplify = true;
    hasFingerprints = false;
    isConsolidateCaptureIds = false;
    consolidationTimeThreshold = 500;
    isSimplifyPort = true;
    isCombineByAlias = false;
    IdFromCallID;
    isFilterOpened = false;

    hasFingerprints$ = new BehaviorSubject<boolean>(false);
    consolidationFilterSubscription: Subscription;

    checkboxListFilterPayloadType = [];
    checkboxListFilterPort = [];
    checkboxListFilterCallId = [];
    checkboxListFilterIP = [];
    checkboxListFilterAliases = [];
    hosts = [];
    _sipDataItem;
    _isSingleIP = false;
    combineType = '3port';
    listCombineTypes = {
        '1none': 'Non grouped',
        '2alias': 'Group by Alias',
        '3port': 'Group by IP',
    };

    _type = 'Flow';
    _channel: string = '';
    @Input('channel') set channel(val: string) {
        // console.log('FILTER: channel', val);
        this._channel = val;
    }
    get channel() {
        return this._channel;
    }

    @Input('type') set type(val) {
        this._type = val || this._type;
        if (this.isMediaReportsTab) {
            this.checkboxListFilterPayloadType.forEach((i) => {
                i.selected = ['RTP', 'RTCP'].includes(i.title);
            });
        } else {
            this.restoreFiltersFromLocalStorage();
        }
    }

    @Input('dataItem')
    get dataItem() {
        return this._sipDataItem;
    }
    set dataItem(data) {
        if (!data) {
            return;
        }

        this._sipDataItem = data;
        this._sipDataItem.metadata = { dataType: data.type };

        const { filters, callid, hosts } = data.data;
        const [callidFirst] = callid;
        this.hosts = hosts;

        /**
         * IP filter
         */
        this.checkboxListFilterIP = Functions.arrayUniques(
            hosts.map((i) => i.ip)
        ).map((i) => ({
            title: i,
            selected: true,
        }));

        this._isSingleIP = this.checkboxListFilterIP.length === 1;

        /**
         * Alias filter
         */
        this.checkboxListFilterAliases = Functions.arrayUniques(
            hosts.map((i) => i.alias)
        ).map((i) => ({
            title: i,
            selected: true,
        }));

        /**
         * PayloadType
         */

        this.checkboxListFilterPayloadType = Object.entries(filters.payload)
            .filter((i) => i[1])
            .map((record) => {
                const [typeName] = record;
                return {
                    title: typeName,
                    selected:
                        this.isAdvancedDefaultFilter ?
                            this.getPayloadFromAdvancedSettings(typeName) :
                            (this.getPayloadFromLocalStorage(typeName) || (
                                typeName !== FlowItemType.RTCP &&
                                typeName !== FlowItemType.RTP
                            )),
                };
            });
        console.log('checkboxListFilterPayloadType', this.checkboxListFilterPayloadType);

        /**
         * Call-ID
         */
        this.checkboxListFilterCallId = callid?.map((i) => {
            const color = this.callIDColorList?.find((callID) => callID.callID === i);
            const compiledColor = `hsla(${color?.decompiledColor?.hue}, ${color?.decompiledColor?.saturation}%, ${color?.decompiledColor?.lightness}%, 1)`;
            return {
                title: i,
                selected: true,
                color: compiledColor || Functions.getColorByString(i),
            };
        });

        this.IdFromCallID = callidFirst;
        // console.log('this.channel', this.channel);
        this.flowFilters = {
            channel: this.channel,
            isSimplify: this.isSimplify,
            isConsolidateCaptureIds: this.isConsolidateCaptureIds,
            consolidationTimeThreshold: this.consolidationTimeThreshold,
            isSimplifyPort: !this._isSingleIP ? this.isSimplifyPort : false,
            isCombineByAlias: !this._isSingleIP ? this.isCombineByAlias : false,
            PayloadType: this.checkboxListFilterPayloadType,
            filterIP: this.checkboxListFilterIP,
            filterAlias: this.checkboxListFilterAliases,
            CallId: this.checkboxListFilterCallId,
        };

        this.transactionFilterService.setFilter(this.flowFilters);

        this.restoreFiltersFromLocalStorage();
        try {
            this.cdr.detectChanges();
        } catch (err) { }
    }

    @Input() callIDColorList: Array<CallIDColor>;
    @ViewChild('filterContainer', { static: false }) filterContainer: ElementRef;
    constructor(
        private cdr: ChangeDetectorRef,
        private _pas: PreferenceAdvancedService,
        private transactionFilterService: TransactionFilterService,
        private alertService: AlertService,
        private consolidationService: CallCaptureIdConsolidationService
    ) { }

    async ngOnInit() {
        const advanced = await lastValueFrom(this._pas.getAll());
        const filterSettings = advanced?.data?.find(i =>
            i.category == 'transaction' &&
            i.param == "filter"
        )?.data;

        this.checkFingerprints();

        // Initialize the consolidation state from the service
        this.consolidationFilterSubscription = this.consolidationService.consolidationFilter$.subscribe(value => {
            this.isConsolidateCaptureIds = value.isConsolidateCaptureIds;
            this.consolidationTimeThreshold = value.consolidationTimeThreshold;
            this.cdr.detectChanges();
        });

        this.isAdvancedDefaultFilter = !!filterSettings;
        this.filterSettings = filterSettings;
        console.log({
            filterSettings

        });
    }

    ngOnDestory() {
        if (this.consolidationFilterSubscription) {
            this.consolidationFilterSubscription.unsubscribe();
        }
    }

    private checkFingerprints(): void {
        setTimeout(() => {
            const hasFingerprint = this.dataItem.data.messages.some(
                (i) => i.messageData.item?.fingerprint !== undefined
            );
            console.log("fingerprints:", hasFingerprint);
            this.hasFingerprints$.next(hasFingerprint);
        }, 0);
    }

    doFilterMessages(type: string = null) {
        setTimeout(() => {
            if (this.combineType === '1none') {
                this.isCombineByAlias = false;
                this.isSimplifyPort = false;
            } else if (this.combineType === '2alias') {
                this.isCombineByAlias = true;
                this.isSimplifyPort = true;
            } else if (this.combineType === '3port') {
                this.isCombineByAlias = false;
                this.isSimplifyPort = true;
            }

            if (type === 'alias') {
                this.checkboxListFilterAliases?.forEach((alias) => {
                    const getArrayIPByAlias = Functions.arrayUniques(
                        this.hosts.filter((i) => i.alias === alias.title).map((i) => i.ip)
                    );
                    getArrayIPByAlias?.forEach((ip) => {
                        (
                            this.checkboxListFilterIP?.find(({ title }) => title === ip) || {}
                        ).selected = alias.selected;
                    });
                });
                this.cdr.detectChanges();
            }
            console.log('this.checkboxListFilterPayloadType', this.checkboxListFilterPayloadType);
            if (
                this.checkboxListFilterPayloadType.every(
                    (type) => type.selected === false
                )
            ) {
                this.checkboxListFilterPayloadType[0].selected = true;
                const alert: AlertMessage = {
                    message: 'notifications.notice.item_was_filtered',
                    isTranslation: true,
                    translationParams: { type: 'Payload' },
                };
                this.alertService.notice(alert);
            }
            if (this.checkboxListFilterCallId.every(type => type.selected === false)) {
                this.checkboxListFilterCallId[0].selected = true;
                const alert: AlertMessage = {
                    message: 'notifications.notice.item_was_filtered',
                    isTranslation: true,
                    translationParams: { type: 'Call ID' }
                }
                this.alertService.notice(alert)
            }

            if (this.checkboxListFilterIP.every(type => type.selected === false)) {
                this.checkboxListFilterIP[0].selected = true;
                const alert: AlertMessage = {
                    message: 'notifications.notice.item_was_filtered',
                    isTranslation: true,
                    translationParams: { type: 'IP' }
                }
                this.alertService.notice(alert)
            }
            // console.log('this.channel', this.channel);
            this.flowFilters = {
                channel: this.channel,
                isSimplify: this.isSimplify,
                isConsolidateCaptureIds: this.isConsolidateCaptureIds,
                consolidationTimeThreshold: this.consolidationTimeThreshold,
                isSimplifyPort: this.isSimplifyPort,
                isCombineByAlias: this.isCombineByAlias,
                PayloadType: this.checkboxListFilterPayloadType,
                filterIP: this.checkboxListFilterIP,

                CallId: this.checkboxListFilterCallId,
            };
            if (!this.isMediaReportsTab) {
                this.saveFiltersToLocalStorage();
            }
            this.transactionFilterService.setFilter(this.flowFilters);
            this.consolidationService.setConsolidationFilter({
                isConsolidateCaptureIds: this.isConsolidateCaptureIds,
                consolidationTimeThreshold: this.consolidationTimeThreshold
            });

            this.cdr.detectChanges();
        });
    }
    saveFiltersToLocalStorage() {
        setStorage(UserConstValue.LOCAL_FILTER_STATE, {
            isSimplify: this.isSimplify,
            isConsolidateCaptureIds: this.isConsolidateCaptureIds,
            consolidationTimeThreshold: this.consolidationTimeThreshold,
            isSimplifyPort: this.isSimplifyPort,
            isCombineByAlias: this.isCombineByAlias,
            combineType: this.combineType,

            flowFilters: {
                isSimplify: this.isSimplify,
                isConsolidateCaptureIds: this.isConsolidateCaptureIds,
                consolidationTimeThreshold: this.consolidationTimeThreshold,
                isSimplifyPort: this.isSimplifyPort,
                isCombineByAlias: this.isCombineByAlias,
                // filterIP: this.checkboxListFilterIP,
                // filterAlias: this.checkboxListFilterAliases,
            },
        });
        localStorage.removeItem(ConstValue.LOCAL_FILTER_STATE);
    }
    getPayloadFromAdvancedSettings(type: string = 'RTP'): boolean {

        return !!this.filterSettings[type];

    }
    getPayloadFromLocalStorage(type: string = 'RTP') {
        const defaultReturn =
            type === FlowItemType.SIP || type === FlowItemType.SDP;
        let localFilterState: any =
            localStorage.getItem(UserConstValue.LOCAL_FILTER_STATE) ||
            localStorage.getItem(ConstValue.LOCAL_FILTER_STATE);
        if (localFilterState) {
            try {
                localFilterState = Functions.JSON_parse(localFilterState);
                const { PayloadType } = localFilterState.flowFilters;
                if (PayloadType) {
                    return (
                        PayloadType?.find((i) => i.title === type) || {
                            selected: defaultReturn,
                        }
                    ).selected;
                } else {
                    return defaultReturn;
                }
            } catch (err) {
                return defaultReturn;
            }
        } else {
            return defaultReturn;
        }
    }
    restoreFiltersFromLocalStorage() {
        /** restore from localStorage */
        let localFilterState: any =
            localStorage.getItem(UserConstValue.LOCAL_FILTER_STATE) ||
            localStorage.getItem(ConstValue.LOCAL_FILTER_STATE);
        if (localFilterState) {
            try {
                localFilterState = Functions.JSON_parse(localFilterState);
                this.combineType = !this._isSingleIP
                    ? localFilterState.combineType
                    : '1none';
                this.isSimplify = localFilterState.isSimplify;

                this.isConsolidateCaptureIds = localFilterState.isConsolidateCaptureIds;
                this.consolidationTimeThreshold = localFilterState.consolidationTimeThreshold;
                this.consolidationService.setConsolidationFilter({
                    isConsolidateCaptureIds: localFilterState.isConsolidateCaptureIds,
                    consolidationTimeThreshold: localFilterState.consolidationTimeThreshold
                });

                this.isSimplifyPort = !this._isSingleIP
                    ? localFilterState.isSimplifyPort
                    : false;
                this.isCombineByAlias = !this._isSingleIP
                    ? localFilterState.isCombineByAlias
                    : false;

                this.flowFilters = this.flowFilters || {};
                this.flowFilters.isSimplify = localFilterState.flowFilters.isSimplify;
                this.flowFilters.isConsolidateCaptureIds =
                    localFilterState.flowFilters.isConsolidateCaptureIds;
                this.flowFilters.consolidationTimeThreshold =
                    localFilterState.flowFilters.consolidationTimeThreshold;
                this.flowFilters.isSimplifyPort = !this._isSingleIP
                    ? localFilterState.flowFilters.isSimplifyPort
                    : false;
                this.flowFilters.isCombineByAlias = !this._isSingleIP
                    ? localFilterState.flowFilters.isCombineByAlias
                    : false;
                this.checkboxListFilterPayloadType = this.flowFilters.PayloadType;

                this.cdr.detectChanges();
            } catch (err) {
                console.error(new Error(err));
                localStorage.removeItem(UserConstValue.LOCAL_FILTER_STATE);
                localStorage.removeItem(ConstValue.LOCAL_FILTER_STATE);
            }
        } else {
            this.saveFiltersToLocalStorage();
        }
    }
    doOpenFilter() {
        if (this.isFilterOpened) {
            return;
        }
        setTimeout(() => {
            this.isFilterOpened = true;
            this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement: any) {
        if (this.filterContainer && this.filterContainer.nativeElement) {
            const clickedInside =
                this.filterContainer.nativeElement.contains(targetElement);
            if (!clickedInside && this.isFilterOpened) {
                this.hideFilter();
            }
        }
    }
    hideFilter() {
        this.isFilterOpened = false;
        this.cdr.detectChanges();
    }
    get isMessageTab(): boolean {
        return this._type === 'Messages';
    }
    get isFlowTab(): boolean {
        return this._type === 'Flow';
    }
    get isGraphTab(): boolean {
        return this._type === 'Graph';
    }
    get isMediaReportsTab(): boolean {
        return this._type === 'Media Reports';
    }
}
