import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingProtosearchWidgetComponent } from './setting-protosearch-widget.component';
import { Router } from '@angular/router';
import { IWidget } from '../IWidget';
import { Subscription } from 'rxjs';
import { Functions } from '@app/helpers/functions';
import { Widget } from '@app/helpers/widget';

import {
    DashboardService,
    DashboardEventData,
    SessionStorageService,
    UserSettings,
    PreferenceMappingProtocolService
} from '@app/services';
import { ConstValue } from '@app/models';
import { FormControl } from '@angular/forms';

interface SearchFieldItem {
    field_name: string;
    form_type: string;
    hepid: number;
    name: string;
    profile: string;
    selection: string;
    type: string;
    value?: string;
}

@Component({
    selector: 'app-protosearch-widget',
    templateUrl: './protosearch-widget.component.html',
    styleUrls: ['./protosearch-widget.component.css']
})
@Widget({
    title: 'Proto Search',
    description: 'Display Protocol Search Form',
    category: 'Search',
    indexName: 'display-results'
})
export class ProtosearchWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings = new EventEmitter<any> ();

    private subscriptionStorage: Subscription;
    private dashboardEventSubscriber: Subscription;

    /* LOKI */
    lokiQueryText: string;
    searchQueryLoki: any;

    _cache: any;
    buttonState = true;
    searchQuery: any;
    fields = [];
    widgetId: string;
    widgetResultList: Array<any>;
    widgetResultListLastSelect: string;
    isConfig = false;
    targetResultsContainerValue = new FormControl();
    constructor(
        public dialog: MatDialog,
        private router: Router,
        private _sss: SessionStorageService,
        private _ds: DashboardService,
        private preferenceMappingProtocolService: PreferenceMappingProtocolService) {}

    ngOnInit() {
        if (!this.config) {
            this.isConfig = false;
            this.config = {
                id: this.id,
                title: 'Proto Search',
                group: 'Search',
                name: 'protosearch',
                description: 'Display Search Form component',
                refresh: false,
                sizeX: 2,
                sizeY: 2,
                config: {
                   title: 'CALL SIP SEARCH',
                   searchbutton: false,
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
                fields: [],
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

        this.widgetId = '_' + Functions.md5(JSON.stringify(this.config));

        this.config.config = this.config.config || {};
        this.config.fields = (this.config.fields || []).map(item => {
            item.value = '';
            return item;
        });

        this.updateButtonState();

        this.initSubscribes();
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
                this.fields.forEach(item => {
                    item.value = (this._cache.fields.filter(i => i.name === item.field_name)[0] || {value: ''}).value;
                    if (item.field_name === ConstValue.CONTAINER) {
                        this.targetResultsContainerValue.setValue(item.value);
                    }
                });
            }
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
                    const _c = this._cache ? this._cache.fields.filter(i => i.name === ConstValue.CONTAINER)[0] : null;
                    if (_c) {
                        this.targetResultsContainerValue.setValue(_c.value);
                        item.value = _c.value;
                    } else {
                        item.value = Functions.cloneObject(this.widgetResultList[0]);
                        this.targetResultsContainerValue.setValue(item.value);
                    }
                }
            });
        });
    }
    private updateButtonState() {
        this.buttonState = this.config.config.searchbutton;

        /* clone Object */
        this.fields = Functions.cloneObject(this.config.fields);
    }

    private saveState() {
        if (this.isLoki) {
            this._sss.saveProtoSearchConfig(this.widgetId, this.searchQuery);
            return;
        }
        this.searchQuery = {
            fields: this.fields.filter((item: any) => item.value !== '')
                .map((item: any) => ({
                    name: item.field_name,
                    value: item.value,
                    type: item.type,
                    hepid: item.hepid
                })),
            protocol_id: '1_' + this.config.config.protocol_profile.value // 1_call | 1_ default | 1_registration
        };

        this._sss.saveProtoSearchConfig(this.widgetId, Functions.cloneObject(this.searchQuery));
        // console.log({SQ: Functions.cloneObject(this.searchQuery)});

        this.searchQuery.fields = this.searchQuery.fields.filter(i => i.name !== ConstValue.CONTAINER);
    }

    onClearFields () {
        this.fields.forEach(item => item.value = '');
        this._sss.removeProtoSearchConfig(this.widgetId);
    }

    openDialog(): void {
        const subscription = this.preferenceMappingProtocolService.getAll().subscribe(data => {
            const dialogRef = this.dialog.open(SettingProtosearchWidgetComponent, {
                width: '600px',
                data: {
                    config: this.config,
                    mapping: data,
                    isButton: this.buttonState
                }
            });

            const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    if (result.fields && result.fields.length !== 0) {
                        this.config.protocol_id = result.protocol_id;
                        this.config.config.protocol_profile = {
                            name: result.profile,
                            value: result.profile,
                        };
                        this.config.fields = result.fields.map(item => {
                            const res: SearchFieldItem = {
                                field_name: item.id,
                                form_type: item.proto.hep_alias,
                                hepid: 1,
                                name: `1:${result.profile}:${item.id}`,
                                profile: item.proto.profile,
                                selection: item.name,
                                type: 'string',
                            };
                            return res;
                        });
                    }
                    this.config.title = result.title;
                    this.config.config.title = result.title;
                    this.config.config.searchbutton = !!result.isButton;

                    this._sss.removeProtoSearchConfig(this.widgetId);
                    this.widgetId = '_' + Functions.md5(JSON.stringify(this.config));

                    this.updateButtonState();
                    this.changeSettings.emit({
                        config: this.config,
                        id: this.id
                    });
                    this.isConfig = true;
                }
                dialogRefSubscription.unsubscribe();
            });
            subscription.unsubscribe();
        });
    }

    onChangeField (event) {
        this.fields.forEach(i => {
            if (i.field_name === ConstValue.CONTAINER) {
                i.value = this.targetResultsContainerValue.value;
            }
        });
        this.saveState();
    }

    doSearchResult () {
        const targetResult = this.targetResultsContainerValue.value;
        let _targetResult: any;
        this.saveState();
        if (targetResult) {
            _targetResult = Functions.cloneObject(targetResult);
            if ( _targetResult.type === 'page') {
                localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(this.searchQuery));
                this.router.navigate(['call/result']);
            } else {
                this._ds.setQueryToWidgetResult(_targetResult.id, this.searchQuery);
            }
            return;
        }

        localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(this.searchQuery));
        this.router.navigate(['call/result']);
    }

    handleEnterKeyPress(event) {
        const tagName = event.target.tagName.toLowerCase();
        if (tagName !== 'textarea') {
            setTimeout(this.doSearchResult.bind(this), 100);
            return false;
        }
    }

    compareResultListItem (a: any, b: any) {
        if (b === null || b === undefined) {
            return false;
        }
        return a.id === b.id;
    }

    onLokiCodeData(event) {
        this.searchQuery = event;
        this.searchQuery.limit = (this.fields.filter(i => i.field_name === ConstValue.LIMIT)[0] || {value: 100}).value || 100;
        this.searchQuery.protocol_id = ConstValue.LOKI_PREFIX;
        this.searchQuery.fields = [];
    }

    private get isLoki(): boolean {
        return this.fields.filter(i => i.field_name === 'loki').length !== 0;
    }
    ngOnDestroy () {
        if (this.subscriptionStorage) {
            this.subscriptionStorage.unsubscribe();
        }
        if (this.subscriptionStorage) {
            this.dashboardEventSubscriber.unsubscribe();
        }
    }
}

