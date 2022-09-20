import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { SettingIframeWidgetComponent } from './setting-grafana-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '@app/services/data-time-range.service';
import { AuthenticationService } from '@app/services';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { IWidget } from '../IWidget';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';

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
        hasVariables?: boolean;
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
    minWidth: 300,

})
export class IframeWidgetComponent implements IWidget, OnInit, OnDestroy {
    @Input() config: IframeConfig;
    @Input() id: string;
    @Output() changeSettings = new EventEmitter<any>();

    @ViewChild('frame', { static: true }) frame: ElementRef;
    private envUrl = `${environment.apiUrl.replace('/api/v3', '')}`;
    private grafanaUrl = `${this.envUrl}/grafana`;
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

    isSameOrigin: boolean = false;
    constructor(
        public dialog: MatDialog,
        private _dtrs: DateTimeRangeService,
        private cdr: ChangeDetectorRef,
        private auths: AuthenticationService,
        public translateService: TranslateService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        if (typeof this.config !== 'undefined' && this.config !== null) {
            this.url = this.config.configuredUrl;
        }
        this._config = {
            id: this.id,
            title: 'Grafana',
            typeDataRange: 'global',
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
                this.cdr.detectChanges();
            }
        });
        this.isSameOrigin = this.envUrl === `${window.location.protocol}//${window.location.host}`;
        this.cdr.detectChanges();
    }

    public refresh() {
        this.buildUrl(true);
        this.cdr.detectChanges();
    }

    async buildUrl(noCache: boolean = false) {
        const currentUser = this.auths.currentUserValue;
        const shortToken = currentUser.token.slice(currentUser.token.length - 15);
        this.url = '';
        this.cdr.detectChanges();
        if (this._config.url === 'none' || typeof this.panelListValue === 'undefined') {
            this.iframeLoaded = false;
            return;
        }
        const params = this._config.params;
        if (noCache) {
            params.rand = (Math.random() * 999999).toFixed(0);
        }
        const paramString = Object.keys(params).map(i => `${i}=${params[i]}`).join('&');
        this.url = `${this._config.url}?${paramString}`;
        this.url = this.url.replace('/d-solo/', '');
        const modifier = this.isSameOrigin && this._config.params.hasVariables ? '/d/' : '/d-solo/';
        this.url = `${this.grafanaUrl}${modifier}${this.url}&JWT=${shortToken}&kiosk=full`;
        this._config.configuredUrl = this.url;
        this.cdr.detectChanges();
    }
        // To work on Grafana "Variables" feature you have to have setup with same origin for backend and UI 
    // or set ---disable-site-isolation-trials flag in chrome, DON'T FORGET TO REMOVE FLAG AFTERWARDS, IT IS UNSAFE
    onLoadIframe() {
        if (typeof this._config !== 'undefined' && this._config.url !== 'none') {
            this.iframeLoaded = true;
            if (this.isSameOrigin && this._config.params.hasVariables) {
                let isHeader = false
                let interval = setInterval(() => {
                    isHeader = !!this.frame.nativeElement.contentWindow.document.querySelector('header')
                    if (isHeader) {
                        clearInterval(interval)
                        this.frame.nativeElement.contentWindow.document.querySelector('header').hidden = true;
                        this.frame.nativeElement.contentWindow.document.querySelector('.track-vertical').style.setProperty('width', '0', 'important')
                        this.frame.nativeElement.contentWindow.document.querySelector('.react-grid-layout').style.setProperty('height', '0', 'important')
                        const submenu = this.frame.nativeElement.contentWindow.document.querySelector('.submenu-controls')
                        if (submenu) {
                            submenu.style.setProperty('padding-top', '5px', 'important')
                            submenu.style.setProperty('margin-left', '16px', 'important')
                        }
                        this.frame.nativeElement.contentWindow.document.querySelectorAll('.scrollbar-view')[1].children[0].style.setProperty('padding', '0', 'important')
                        const sidemenu = this.frame.nativeElement.contentWindow.document.querySelector('.sidemenu')
                        if (sidemenu) {
                            sidemenu.style.setProperty('display', 'none', 'important')
                        }
                    }
                }, 10);
            }

            this.cdr.detectChanges();
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

        dialogRef.afterClosed().toPromise().then((data: any) => {
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
                this.cdr.detectChanges();
            }
        });
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
