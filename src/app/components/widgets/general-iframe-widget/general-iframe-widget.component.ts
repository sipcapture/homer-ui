import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import { SettingGeneralIframeWidgetComponent } from './setting-general-iframe-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { DateTimeRangeService, DateTimeTick} from '../../../services/data-time-range.service';

import { Subscription } from 'rxjs';
import { IWidget } from '../IWidget';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';


export interface GeneralIframeConfig {
    id?: string;
    title: string;
    desc: string;
    dashboardSource?: string;
    panelListValue?: string;
    url: string;
    refresh: boolean;
}

@Component({
    selector: 'app-general-iframe-widget',
    templateUrl: './general-iframe-widget.component.html',
    styleUrls: ['./general-iframe-widget.component.scss']
})
@Widget({
    title: 'Embed Content',
    description: 'Display External Content in iFrame',
    category: 'Visualize',
    indexName: 'embed-content',
    className: 'GeneralIframeWidgetComponent',
    minHeight: 300,
    minWidth: 300
})
export class GeneralIframeWidgetComponent implements IWidget {
    @Input() config: GeneralIframeConfig;
    @Input() id: string;
    @Output() changeSettings = new EventEmitter<any> ();

    url: string;
    _config: GeneralIframeConfig;
    desc: string;
    name: string;

    subscription: Subscription;
    GeneralIframeLoaded = true;

    constructor(
        public dialog: MatDialog,
        private _dtrs: DateTimeRangeService,
        ) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        this._config = {
            id: this.id,
            title: 'IFrame',
            desc: 'Some description',
            url: 'https://www.google.com',
            refresh: true,
        };

        if (this.config) {
            this.GeneralIframeLoaded = true;
            this._config.url = this.config.url || this._config.url;
            this._config.title = this.config.title || 'GeneralIframe';
            this._config.refresh = this.config.refresh;
        } else {
            this.GeneralIframeLoaded = false;
        }

        this.buildUrl();

        this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {
            if (this._config.refresh) {
                this.buildUrl();
            }
        });
    }
    public refresh() {
        this.buildUrl();
    }

    buildUrl() {
        if (this._config.url === 'none') {
            this.GeneralIframeLoaded = false;
            return;
        }
        this.url = this._config.url;
    }

    onLoadGeneralIframe() {
        this.GeneralIframeLoaded = true;
    }

    async openDialog() {
        const dialogRef = this.dialog.open(SettingGeneralIframeWidgetComponent, {
            width: '610px',
            data: {
                name: this.name,
                desc: this.desc,
                title: this._config.title,
                url: this._config.url,
                refresh: this._config.refresh,
            }
        });

        const result = await dialogRef.afterClosed().toPromise();

        if (result) {
            this.desc = result.desc;
            this._config.title = result.title;
            this._config.url = result.url;
            this._config.refresh = result.refresh;

            this.buildUrl();

            this.changeSettings.emit({
                config: this._config,
                id: this.id
            });
        }
    }

    ngOnDestroy () {}
}
