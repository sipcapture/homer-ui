import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { DashboardService } from '@app/services';
import { SettingResultWidgetComponent } from './setting-result-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-result-widget',
    templateUrl: './result-widget.component.html',
    styleUrls: ['./result-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
@Widget({
    title: 'Display Results',
    description: 'Display Search results in Widgets',
    category: 'Visualize',
    indexName: 'result',
    settingWindow: true,
    className: 'ResultWidgetComponent',
    minHeight: 300,
    minWidth: 500
})
export class ResultWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings: EventEmitter<any> = new EventEmitter();

    lastTimestamp: number;
    title: string;
    isLoaded = false;
    _interval: any;
    constructor(
        public dialog: MatDialog,
        private _ds: DashboardService,
        private cdr: ChangeDetectorRef
    ) {
        this._ds.dashboardEvent.subscribe(data => {
            const dataId = data.resultWidget[this.id];
            if (dataId && dataId.query) {
                if (this.lastTimestamp === dataId.timestamp) {
                    return;
                }
                this.lastTimestamp = dataId.timestamp;
            } else {
                return;
            }
            this.reloadContainer();
        });
        this.reloadContainer();
        this.title = this.config ? this.config.title : '';
    }

    private reloadContainer () {
        this.isLoaded = false;
        setTimeout(() => {
            this.isLoaded = true;
            this.cdr.detectChanges();
        }, 1000);
    }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
    }
    onDataReady() {
        this.isLoaded = true;
        this.cdr.detectChanges();
    }
    async openDialog() {
        const dialogRef = this.dialog.open(SettingResultWidgetComponent, {
            data: { title: this.title }
        });
        const result = await dialogRef.afterClosed().toPromise();
        if (result) {
            this.title = result.title;
            this.saveConfig();
            this.cdr.detectChanges();
        }
    }
    saveConfig() {
        const _f = Functions.cloneObject;
        this.config = {
            title: this.title
        };

        this.changeSettings.emit({
            config: _f(this.config),
            id: this.id
        });
    }
    ngOnDestroy() { }
}
