import {
    Input,
    Output,
    Component,
    ViewChild,
    EventEmitter,
    AfterViewInit,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IWidget } from '../IWidget';
import {
    Subscription,
    Observable,
    from
} from 'rxjs';
import { Functions } from '@app/helpers/functions';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import {map, startWith} from 'rxjs/operators';

import {
    DashboardService,
    DashboardEventData,
    SessionStorageService,
    UserSettings,
    PreferenceMappingProtocolService,
    SearchService
} from '@app/services';
import { ConstValue } from '@app/models';
import { FormControl } from '@angular/forms';
import { CodeStyleSmartInputFieldComponent } from '../rsearch-widget/code-style-smart-input-field/code-style-smart-input-field.component';
import { SettingSmartInputWidgetComponent } from './setting-smart-input-widget.component';

@Component({
    selector: 'app-smart-input-widget',
    templateUrl: './smart-input-widget.component.html',
    styleUrls: ['./smart-input-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Widget({
    title: 'Smart input Search',
    description: 'Display Smart input Search Form',
    category: 'Search',
    indexName: 'smart-input',
    className: 'SmartInputWidgetComponent',
    settingWindow: true,
    submit: true,
    minHeight: 300,
    minWidth: 300
})
export class SmartInputWidgetComponent implements IWidget, OnInit, AfterViewInit, OnDestroy {
    @Input() id: string;
    _config: any;
    @Input() set config(value: any) {
        this._config = value;
    }
    get config() {
        return this._config;
    }
    _fields = [];
    @Input() set fields(val) {
        this._fields = Functions.cloneObject(val);
        this.cdr.detectChanges();
        this.initSliderSmartInput(true);
    }
    get fields() {
        return this._fields;
    }

    @Input() autoline = false;
    @Input() targetResultId = null;
    @Input() onlySmartField = false;
    onlySmartFieldTEXT = '';
    @Output() changeSettings = new EventEmitter<any> ();
    @Output() dosearch = new EventEmitter<any> ();

    @ViewChild('onlySmartFieldElement', {static: false}) onlySmartFieldElement: CodeStyleSmartInputFieldComponent;

    private subscriptionStorage: Subscription;
    private dashboardEventSubscriber: Subscription;

    /* LOKI */
    lokiQueryText: string;
    searchQueryLoki: any;

    countFieldColumns = 1;
    fieldsFromSmartInput: any;
    _cache: any;
    buttonState = true;
    searchQuery: any;

    widgetId: string;
    widgetResultList: Array<any>;
    widgetResultListLastSelect: string;
    isConfig = true;
    mapping: any;
    targetResultsContainerValue = new FormControl();
    SmartInputQueryText = '';
    _lastInterval: any;
    constructor(
        public dialog: MatDialog,
        private router: Router,
        private searchService: SearchService,
        private _sss: SessionStorageService,
        private _ds: DashboardService,
        private cdr: ChangeDetectorRef,
        private preferenceMappingProtocolService: PreferenceMappingProtocolService) {}

    async ngOnInit() {
            WidgetArrayInstance[this.id] = this as IWidget;
            if (!this.config) {
                this.isConfig = false;
                this.config = {
                    id: this.id,
                    title: 'Smart input Search',
                    group: 'Search',
                    name: 'smart-input',
                    description: 'Display Smart input Search Form component',
                    refresh: false,
                    sizeX: 2,
                    sizeY: 2,
                    config: {
                        title: 'Smart input Search',
                        searchbutton: true,
                        protocol_id: {
                            name: 'SIP',
                            value: 1
                        },
                        protocol_profile: {
                            name: 'call',
                            value: 'call'
                        }
                    },
                    uuid: 'ed426bd0-ff21-40f7-8852-58700abc3762',
                    fields: [{
                        field_name: 'smartinput',
                        form_api: '/smart/search/tag/:hepid/:hepprofile',
                        form_type: 'smart-input',
                        full_api_link: '/smart/search/tag/1/call',
                        hepid: 1,
                        name: '1:call:smartinput',
                        selection: 'Smart Input',
                        type: 'string',
                        value: '',
                    },
                    {
                        field_name: 'limit',
                        form_default: null,
                        hepid: 1,
                        name: '1:call:limit',
                        selection: 'Query Limit',
                        type: 'string',
                        value: '',
                    },
                    {
                        field_name: 'targetResultsContainer',
                        form_default: null,
                        hepid: 1,
                        name: '1:call:targetResultsContainer',
                        selection: 'Results Container',
                        type: 'string',
                    }],
                    countFieldColumns: this.countFieldColumns,
                    row: 0,
                    col: 1,
                    cols: 2,
                    rows: 2,
                    x: 0,
                    y: 1
                };
            } else {
                this.isConfig = true;
            }

            this.widgetId = this.id || '_' + Functions.md5(JSON.stringify(this.config));

            this.config.config = this.config.config || {};
            this.config.fields = (this.config.fields || []).map(item => {
                item.value = '';
                return item;
            });
            this.mapping = await this.preferenceMappingProtocolService.getAll().toPromise();
            this.updateButtonState();
            this.initSubscribes();
    }
    ngAfterViewInit() {
        this.initSliderSmartInput();
    }
    private initSliderSmartInput(onlyFieldsDoParse = false) {
        this.cdr.detectChanges();
        if (this.onlySmartFieldElement) {
            const configData = this.config && this.config.param && this.config.param.search;
            if (onlyFieldsDoParse && configData && Object.keys(configData).length !== 0) {
                const [fields] = Object.values(configData) as any;
                this.onlySmartFieldTEXT = fields.map(item => {
                    if (item.name === 'smartinput') {
                        return item.value;
                    }
                    return `${item.name}="${item.value}"`;
                }).join(' AND ');
            } else {
                const fSmartinput = this._fields.find(i => i.field_name === 'smartinput');
                if (fSmartinput && fSmartinput.value && fSmartinput.value !== '') {
                    this.onlySmartFieldTEXT = fSmartinput.value;
                } else {
                    this.onlySmartFieldTEXT = this._fields.filter(i => i.value !== '')
                        .map(item => `${item.name}="${item.value}"`).join(' AND ');
                }

            }
            this.cdr.detectChanges();
            this.onlySmartFieldElement.setQueryText(this.onlySmartFieldTEXT);
        }
    }
    getFieldColumns() {
        if (this.autoline) {
            this.countFieldColumns = Math.min(4, this.fields.length);
        } else {
            this.countFieldColumns = this.config.countFieldColumns || this.countFieldColumns;
        }
        return Array.from({length: this.countFieldColumns}, i => '1fr').join(' ');
    }

    private initSubscribes() {
        this.subscriptionStorage = this._sss.sessionStorage.subscribe((data: UserSettings) => {
            this._cache = data.protosearchSettings[this.widgetId];
            if (this._cache && this._cache.hasOwnProperty(ConstValue.serverLoki)) {
                this.fields.forEach(item => {
                    if (item.field_name === ConstValue.LIMIT) {
                        item.value = this._cache.limit;
                    }
                    if (item.field_name === ConstValue.CONTAINER) {
                        this.lokiQueryText = this._cache.text;
                    }
                });
            } else if (this._cache && this._cache.fields) {
                const cacheQuery = this.searchService.getLocalStorageQuery();
                this.fields.forEach(item => {
                    if (item.hasOwnProperty('system_param') && item.mapping) {
                        const [constParam, collectionName, propertyName] = item.mapping.split('.');
                        if (constParam === 'param' &&
                            this._cache[collectionName] &&
                            this._cache[collectionName].mapping === propertyName
                        ) {
                            item.value = this._cache[collectionName].value;
                        }
                    }  else if (item.hasOwnProperty('profile')) {
                        const [f_field] = this._cache.fields.filter(i => i.name === item.field_name);
                        item.value = f_field && f_field.value || '';
                    } else {
                        const [f_field] = this._cache.fields.filter(i => i.name === item.field_name);
                        item.value = f_field && f_field.value || '';
                    }

                    if (item.formControl) {
                        item.formControl.setValue(item.value);
                    }
                    if (item.field_name === ConstValue.CONTAINER && item.value !== '') {
                        if (!Array.isArray(item.value)) {
                            this.targetResultsContainerValue.setValue([item.value]);
                        } else {
                            this.targetResultsContainerValue.setValue(item.value);
                        }
                    }

                    if (item.type &&
                        (item.type === 'integer' || item.type === 'number') &&
                        item.value !== '' && item.value !== null && !isNaN(item.value * 1)
                    ) {
                        item.value = item.value * 1;
                    }

                    if (item.type &&
                        item.type === 'boolean' &&
                        (item.value === 'true' || item.value === 'false')
                    ) {
                        item.value = item.value === 'true';
                    }

                    if (cacheQuery && cacheQuery.location &&
                        cacheQuery.location.mapping &&
                        item.field_name === cacheQuery.location.mapping &&
                        item.form_default
                    ) {
                        item.value = cacheQuery.location.value.map(i => item.form_default.find(j => j.value === i).name);
                    }
                });
            }
            this.cdr.detectChanges();
        });

        this.dashboardEventSubscriber = this._ds.dashboardEvent.subscribe( (data: DashboardEventData) => {
            this.widgetResultList = data.currentWidgetList
                .filter(i => i.name === 'result' || i.name === 'display-results-chart')
                .map( i => ({
                    id : i.id,
                    title: i.config ? i.config.title : i.id,
                    type: 'widget'
                }));
            this.widgetResultList.push({
                id: 'Default',
                title: 'Default',
                type: 'page'
            });

            this.fields.forEach(item => {
                if (item.field_name === ConstValue.CONTAINER) {
                    const _c = this._cache ? this._cache.fields.find(i => i.name === ConstValue.CONTAINER) : null;
                    if (_c) {
                        if (!Array.isArray(_c.value)) {
                            this.targetResultsContainerValue.setValue([_c.value]);
                        } else {
                            this.targetResultsContainerValue.setValue(_c.value);
                        }
                        item.value = _c.value;
                    } else {
                        item.value = Functions.cloneObject(this.widgetResultList[0]);
                        if (!Array.isArray(item.value)) {
                            this.targetResultsContainerValue.setValue([item.value]);
                        } else {
                            this.targetResultsContainerValue.setValue(item.value);
                        }
                    }
                }
            });
        });
    }
    private updateButtonState() {
        this.buttonState = this.config.config.searchbutton;

        /* clone Object */
        this.fields = Functions.cloneObject(this.config.fields);
        if (!(this.config && this.config.config && this.config.config.protocol_profile)) {
            return;
        }
        const m = this.mapping.data.find(i =>
            i.profile === this.config.config.protocol_profile.value &&
            i.hep_alias === this.config.config.protocol_id.name);

        if (m && m.fields_mapping) {
            /* patch */
            if (typeof m.fields_mapping === 'string') {
                try {
                    m.fields_mapping = JSON.parse(m.fields_mapping);
                } catch (err) {
                    m.fields_mapping = [];
                }
            }
            this.fields.forEach(i => {
                const f = m.fields_mapping.find(j => j.id === i.field_name);
                if (f && f.type) {
                    i.type = f.type;
                }
                if (f && f.form_type) {
                    i.form_type = f.form_type;
                    // if (i.form_type === 'number' || i.form_type === 'integer') {
                    //     i.value = isNaN(i.value * 1) ? 0 : i.value * 1;
                    // }
                }
                if (f && f.system_param) {
                    i.system_param = f.system_param;
                    i.mapping = f.mapping;
                }
                
                if (f && f.profile) {
                    i.profile = f.profile;
                }

                if (f && f.form_api) {
                    i.form_api = f.form_api;
                }

                if (f && f.form_default) { /* high priority */
                    i.form_default = f.form_default;
                } else if (i.form_api) { /* seccond priority */
                    if (i.form_type === 'smart-input') {
                        i.full_api_link = String(i.form_api)
                            .replace(':hepid', this.config.config.protocol_id.value)
                            .replace(':hepprofile', this.config.config.protocol_profile.value);
                    } else {
                        this.preferenceMappingProtocolService.getListByUrl(i.form_api).toPromise().then((list: any) => {
                            if (list && list.data) {
                                i.form_default = list.data;
                            } else {
                                i.form_default = null;
                            }
                        });
                    }
                } else {
                    i.form_default = null;
                }
                if (i && i.form_default !== null && i.form_type === 'input') {
                    i.formControl = new FormControl();
                    i.formControl.setValue(i.value);
                    this.autocompliteFiltring(i);
                }
            });
        }
        this.cdr.detectChanges();
    }
    private autocompliteFiltring (item: any) {
        const options: Array<any> = item.form_default;
        const _filter = (value: string): string[] => {
            const filterValue = value.toLowerCase();
            item.value = value;
            return options.filter((option: any) => {
                if (typeof option === 'string') {
                    return option.toLowerCase().includes(filterValue);
                } else if (typeof option === 'object') {
                    return option.name.toLowerCase().includes(filterValue);
                }
            });
        };

        const filteredOptions: Observable<string[]> =
            item.formControl.valueChanges.pipe(
                startWith(''),
                map((value: string) => _filter(value))
            );

        item.filteredOptions = filteredOptions;
        this.cdr.detectChanges();
    }
    private saveState() {
        if (this.isLoki) {
            this._sss.saveProtoSearchConfig(this.widgetId, this.searchQuery);
            return;
        }
        this.searchQuery = {
            fields: this.fields
                .filter((item: any) => {
                    let b;
                    if (typeof item.value === 'string') {
                        b = item.value !== '';
                    } else if (item.form_type === 'select') {
                        b = true;
                    } else if (['boolean'].includes(item.type)) {
                        item.value = item.value === true;
                        b = true;
                    } else if (['number', 'integer'].includes(item.type)) {
                        b = item.value !== null && item.value !== undefined && !isNaN(item.value * 1);
                    } else if (item.value instanceof Array) {
                        b = item.value.length > 0;
                    } else if (item.field_name === ConstValue.CONTAINER) {
                        b = true;
                    } else {
                        b = false;
                    }
                    return b && !item.hasOwnProperty('system_param') && !item.hasOwnProperty('profile');
                })
                .map((item: any) => ({
                    name: item.field_name,
                    value: typeof item.value === 'object' ? item.value : String(item.value),
                    type: item.type,
                    hepid: item.hepid
                })),
            protocol_id: this.config.config.protocol_id.value + '_' + this.config.config.protocol_profile.value // 1_call | 1_ default | 1_registration
        };
        if (this.onlySmartField) {
            this.searchQuery.protocol_id = JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY)).protocol_id;
        }
        /* system params */
        this.fields.forEach((item: any) => {
            if (
                item.value &&
                item.value !== '' &&
                item.hasOwnProperty('system_param') &&
                item.mapping !== ''
            ) {
                const [constParam, collectionName, propertyName] = item.mapping.split('.');
                if (constParam === 'param' && collectionName) {
                    if (item.value instanceof Array && item.form_default) {
                        this.searchQuery[collectionName] = {
                            value: item.value.map(i => item.form_default.find(j => i === j.name).value),
                            mapping: propertyName || ''
                        };
                    } else if (typeof item.value !== 'object') {
                        this.searchQuery[collectionName] = {
                            value: item.value,
                            mapping: propertyName || ''
                        };
                    }
                }
            } else if ( item.value && item.value !== '' &&   item.hasOwnProperty('profile')) {
                this.config.config.protocol_profile.value = item.value;
                this.searchQuery['protocol_id'] = this.config.config.protocol_id.value + '_' + this.config.config.protocol_profile.value;
                 // 1_call | 1_ default | 1_registration
            }
        });

        this.searchService.setLocalStorageQuery(Functions.cloneObject(this.searchQuery));
        this._sss.saveProtoSearchConfig(this.widgetId, Functions.cloneObject(this.searchQuery));

        this.searchQuery.fields = this.searchQuery.fields.filter(i => i.name !== ConstValue.CONTAINER);
        this.cdr.detectChanges();
    }

    onClearFields () {
        this.fields.forEach(item => {
            if (item.formControl) {
                item.formControl.setValue('');
            }
            if (item.form_type === 'multiselect' || item.value instanceof Array) {
                item.value = [];
            } else if (item.form_type === 'smart-input') {
                item.value = '';
            } else {
                item.value = '';
            }

        });
        this._sss.removeProtoSearchConfig(this.widgetId);
        this.cdr.detectChanges();
    }

    public async openDialog() {
        const mapping = await this.preferenceMappingProtocolService.getAll().toPromise();
        const dialogRef = this.dialog.open(SettingSmartInputWidgetComponent, {
            width: '600px',
            data: {
                config: this.config,
                mapping: mapping
            }
        });
        const result = await dialogRef.afterClosed().toPromise();
        if (!result) {
            return;
        }
        this.config.config.protocol_id = result.protocol_id;
        this.config.config.protocol_profile = {
            name: result.profile,
            value: result.profile,
        };
        this.config.title = result.title;
        this.config.config.title = result.title;
        this._sss.removeProtoSearchConfig(this.widgetId);
        const _forRestoreFieldsValue = Functions.cloneObject(this.fields);
        this.updateButtonState();

        this.changeSettings.emit({
            config: this.config,
            id: this.id
        });
        this.isConfig = true;
        this.cdr.detectChanges();
    }

    onChangeField (event = null, item = null) {
        if (event && item && item.form_type === 'multiselect') {
            item.value = event.value;
        }
        this.fields.forEach(i => {
            if (i.field_name === ConstValue.CONTAINER) {
                i.value = this.targetResultsContainerValue.value;
            }
            if (item && item.field_name === i.field_name && i.form_type === 'multiselect') {
                i.value = item.value;
            }
        });
        this.saveState();
        this.cdr.detectChanges();
    }
    onChangeTargetResultsContainer () {
        this.fields.forEach(i => {
            if (i.field_name === ConstValue.CONTAINER) {
                i.value = this.targetResultsContainerValue.value;
            }
        });
        this.saveState();
        this.cdr.detectChanges();
    }
    doSearchResult () {
        const targetResultSelf = {
            id: this.targetResultId,
            title: '',
            type: this.targetResultId ? 'widget' : 'page'
        };

        const isResultContainer = this.fields.filter(i => i.field_name === ConstValue.CONTAINER).length > 0;
        const targetResult = this.targetResultId ? targetResultSelf : this.targetResultsContainerValue.value;
        let _targetResult: any;
        this.saveState();
        if (this.targetResultId || (targetResult && isResultContainer)) {
            _targetResult = Functions.cloneObject(targetResult);
            if (_targetResult.some(target => target.type === 'page')) {
                this.router.navigate(['search/result']);
            } else {
                _targetResult.forEach( target => {
                    this._ds.setQueryToWidgetResult(target.id, this.searchQuery);
                });
            }
            this.dosearch.emit({});
            this.cdr.detectChanges();
            return;
        }
        this.router.navigate(['search/result']);
        this.dosearch.emit({});
        this.cdr.detectChanges();
    }

    compareResultListItem (a: any, b: any) {
        if (b === null || b === undefined) {
            return false;
        }
        return a.id === b.id;
    }

    onLokiCodeData(event) {
        this.searchQuery = event;
        this.searchQuery.limit = (this.fields.find(i => i.field_name === ConstValue.LIMIT) || {value: 100}).value;
        this.searchQuery.protocol_id = ConstValue.LOKI_PREFIX;
        this.searchQuery.fields = [];
        this.cdr.detectChanges();
    }
    onSmartInputCodeData(event, item = null) {
        if (this.onlySmartField) {
            const hepid = this.config &&
                this.config.config &&
                this.config.config.protocol_id &&
                this.config.config.protocol_id.value || 1;
            const [sf] = this.fields;

            if (!sf || !(sf.field_name === 'smartinput' && this.fields.length === 1)) {
                this.fields = [{
                    field_name: 'smartinput',
                    hepid,
                    name: 'smartinput',
                    selection: 'Smart Input',
                    type: 'string',
                    value: event.text
                }];
            } else {
                sf.value = event.text;
                sf.hepid = hepid;
            }
        } else {
            this.fields.forEach(i => {
                if (item && item.field_name === i.field_name && i.form_type === 'smart-input') {
                    i.value = event.text;
                }
            });
            this.saveState();
        }
        // this.saveState();
        this.cdr.detectChanges();
    }
    private get isLoki(): boolean {
        return this.fields.filter(i => i.field_name === 'loki').length !== 0;
    }
    public getFields() {
        return Functions.cloneObject(this.fields);
    }
    ngOnDestroy () {
        if (this.subscriptionStorage) {
            this.subscriptionStorage.unsubscribe();
        }
        if (this.subscriptionStorage) {
            this.dashboardEventSubscriber.unsubscribe();
        }
        if (this._lastInterval) {
            clearInterval(this._lastInterval);
        }
    }
}
