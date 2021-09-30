import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { Functions } from '@app/helpers/functions';
import { MatDialog } from '@angular/material/dialog';
import { SettingResultChartWidgetComponent } from './setting-result-chart-widget.component';

@Component({
    selector: 'app-result-chart-widget',
    templateUrl: './result-chart-widget.component.html',
    styleUrls: ['./result-chart-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Widget({
    title: 'Display Results Chart',
    description: 'Display Search chart results in Widgets',
    category: 'Visualize',
    indexName: 'display-results-chart',
    className: 'ResultChartWidgetComponent',
    minHeight: 400,
    minWidth: 600,
    
})
export class ResultChartWidgetComponent implements IWidget, OnInit, OnDestroy {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings: EventEmitter<any> = new EventEmitter();
    source = 'widget';
    title: string;
    constructor(
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (this.config === null || typeof this.config === 'undefined') {
            this.config = {};
        } 
        WidgetArrayInstance[this.id] = this as IWidget;
        this.cdr.detectChanges();
    }
    chartChangeSettings(event) {
        this.config.chartConfig = event;
        this.saveConfig();
        this.cdr.detectChanges();
    }
    async openDialog() {
        const dialogRef = this.dialog.open(SettingResultChartWidgetComponent, {
            data: { title: this.title }
        });
        this.cdr.detectChanges();
        const result = await dialogRef.afterClosed().toPromise();
        if (result) {
            this.title = result.title;
            this.saveConfig();
            this.cdr.detectChanges();
        }
    }
    private saveConfig() {
        const _f = Functions.cloneObject;
        this.config.title = this.title;

        this.changeSettings.emit({
            config: _f(this.config),
            id: this.id
        });
    }
    ngOnDestroy() {

    }
}
