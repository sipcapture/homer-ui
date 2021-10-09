import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SearchGridCallComponent } from '@app/components/search-grid-call/search-grid-call.component';
import { Functions } from '@app/helpers/functions';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { DashboardService } from '@app/services';
import { IWidget } from '../IWidget';
import { SettingResultWidgetComponent } from './setting-result-widget.component';

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
    indexName: 'RESULT',
    settingWindow: true,
    className: 'ResultWidgetComponent',
    minHeight: 400,
    minWidth: 650,
})
export class ResultWidgetComponent implements IWidget, OnInit, AfterViewInit, OnDestroy {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings: EventEmitter<any> = new EventEmitter();

    @ViewChild('searchGridCall') searchGridCall: SearchGridCallComponent;

    lastTimestamp: number;
    title: string;
    isAutoRefrasher = true;
    isLoaded = false;
    dashboard: any;
    source = 'widget';

    constructor(
        public dialog: MatDialog,
        private dashboardService: DashboardService,
        private cdr: ChangeDetectorRef
    ) { }
    ngAfterViewInit(): void {
        // Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
        // Add 'implements AfterViewInit' to the class.
        this.title = this.id;
        this.cdr.detectChanges();
    }
    async ngOnInit() {
        this.title = this.id;
        WidgetArrayInstance[this.id] = this as IWidget;
        const refresherFromService = this.dashboardService.loadWidgetParam(this.id, 'isAutoRefrasher')
        this.isAutoRefrasher = refresherFromService !== null ? refresherFromService : this.isAutoRefrasher;
        if (this.dashboardService.dbs.currentDashboardType === 6) {
            this.source = 'tab';
        }
        this.cdr.detectChanges();
    }
    onDataReady() {
        this.isLoaded = false;
        setTimeout(() => {
            this.isLoaded = true;
            this.cdr.detectChanges();
        }, 35);
        this.cdr.detectChanges();
    }
    async openDialog() {
        const dialogRef = this.dialog.open(SettingResultWidgetComponent, {
            data: { title: this.title, isAutoRefrasher: this.isAutoRefrasher }
        });
        this.cdr.detectChanges();
        const result = await dialogRef.afterClosed().toPromise();
        if (result) {
            this.title = result.title;
            this.isAutoRefrasher = !!result.isAutoRefrasher;
            this.dashboardService.saveWidgetParam(this.id, 'isAutoRefrasher', this.isAutoRefrasher);
            this.searchGridCall.setAutoRefrasher(this.isAutoRefrasher);

            this.saveConfig();
            this.cdr.detectChanges();
        }
    }
    private saveConfig() {
        const _f = Functions.cloneObject;
        this.config = {
            title: this.title
        };

        this.changeSettings.emit({
            config: _f(this.config),
            id: this.id
        });
    }
    ngOnDestroy() {
    }
}
