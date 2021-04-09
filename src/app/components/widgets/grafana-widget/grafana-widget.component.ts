import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef  } from '@angular/core';
import { SettingIframeWidgetComponent } from './setting-grafana-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '../../../services/data-time-range.service';

import { Subscription } from 'rxjs';
import { IWidget } from '../IWidget';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { PreferenceAdvancedService } from '@app/services';
import { Functions } from '@app/helpers/functions';

import { environment } from '@environments/environment';
export interface IframeConfig {
    id?: string;
    title: string;
    desc: string;
    typeDataRange: string;
    dashboardSource?: string;
    panelListValue?: string;
    url: string;
    serverUrl: string;
    configuredUrl: string;
    params: {
        from: string;
        to: string;
        refresh?: string;
        orgId: number;
        panelId: number;
        theme: string;
        rand?: string;
    };
}

@Component({
    selector: 'app-iframe-widget',
    templateUrl: './grafana-widget.component.html',
    styleUrls: ['./grafana-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
@Widget({
    title: 'Grafana',
    description: 'Display Grafana Metrics',
    category: 'Metrics',
    indexName: 'iframe',
    advancedName: 'grafana',
    className: 'IframeWidgetComponent',
    minHeight: 300,
    minWidth: 300
})
export class IframeWidgetComponent implements IWidget, OnInit, OnDestroy {
    @Input() config: IframeConfig;
    @Input() id: string;
    @Output() changeSettings = new EventEmitter<any> ();

    private envUrl = `${environment.apiUrl.replace('/api/v3','')}/grafana`;
    url: string;
    serverUrl: string;
    _config: IframeConfig;
    desc: string;
    name: string;
    dashboardSource: string;
    panelListValue: string;
    defaultUrl = '';
    subscription: Subscription;
    timeRange: Timestamp;
    iframeLoaded = true;
    _interval: any;

    constructor(
        public dialog: MatDialog,
        private _dtrs: DateTimeRangeService,
        private _pas: PreferenceAdvancedService,
        private cdr: ChangeDetectorRef,
        ) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        const time = this._dtrs.getDatesForQuery(true);
        if (typeof this.config !== 'undefined') {
            this.url = this.config.configuredUrl;
        }
        this._config = {
            id: this.id,
            title: 'Frame title',
            typeDataRange: 'grafana',
            desc: '',
            url: 'none',
            serverUrl: 'none',
            configuredUrl: 'none',
            params: {
                orgId: 1,
                panelId: 2,
                refresh: '1h',
                from: 'now-5m', // 'now-24h',
                to: 'now', // 'now',
                theme: 'light'
            }
        };
        if (this.config) {
            this._config.url = this.config.url || this._config.url;
            this._config.serverUrl = this.config.serverUrl || this._config.serverUrl;
            this._config.serverUrl = this.config.configuredUrl || this._config.configuredUrl;
            this._config.params = this.config.params || this._config.params;
            this.dashboardSource = this.config.dashboardSource;
            this.panelListValue = this.config.panelListValue;
            this._config.typeDataRange = this.config.typeDataRange || this._config.typeDataRange;
            this._config.title = this.config.title || 'Grafana';
            this._config.desc = this.config.desc || this._config.desc;
        }

        this.buildUrl();

        this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {
            if (this._config.typeDataRange !== 'grafana') {
                this.timeRange = this._dtrs.getDatesForQuery(true);
                this._config.params.from = this.timeRange.from + '';
                this._config.params.to = this.timeRange.to + '';
                this.buildUrl();
            }
        });
        this.cdr.detectChanges();
    }

    public refresh() {
        this.buildUrl(true);
    }

    async buildUrl(noCache: boolean = false) {
        if (this._config.url === 'none' || typeof this.panelListValue === 'undefined') {
            this.iframeLoaded = false;
            return;
        }
        const params = this._config.params;
        if (noCache) {
            params.rand = (Math.random() * 999999).toFixed(0);
        }
        this.url = [this._config.url, Object.keys(params).map(i => `${i}=${params[i]}`).join('&')].join('?');
        this.url = `${this.envUrl}${this.url}`;
        this._config.configuredUrl = this.url;
        console.log(this.url)
        this.cdr.detectChanges();
    }

    onLoadIframe() {
        if (typeof this._config !== 'undefined' && this._config.url !== 'none') {
            this.iframeLoaded = true;
        }
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(SettingIframeWidgetComponent, {
            width: '610px',
            data: {
                name: this.name,
                desc: this._config.desc,
                panelListValue: this.panelListValue,
                dashboardSource: this.dashboardSource,
                title: this._config.title,
                url: this._config.url,
                params: this._config.params,
                typeDataRange: this._config.typeDataRange
            }
        });

        const dialogRefSubscription = dialogRef.afterClosed().subscribe( (data: any) => {
            if (data) {
                this._config.desc = data.desc;
                this._config.dashboardSource = this.dashboardSource = data.dashboardSource;
                this._config.panelListValue = this.panelListValue = data.panelListValue;
                this._config.title = data.title;
                this._config.url = data.url;
                this._config.serverUrl = data.serverUrl;
                this._config.params = data.params;
                this._config.typeDataRange = data.typeDataRange;
                if (data.typeDataRange !== 'grafana') {
                    this._config.params.refresh = '';
                }
                this.buildUrl();

                this.changeSettings.emit({
                    config: this._config,
                    id: this.id
                });
            }
            dialogRefSubscription.unsubscribe();
        });
    }
    ngOnDestroy () {
        this.subscription.unsubscribe();
    }
}
