// GRIDSTER & ANGULAR
import {
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChildren,
    QueryList,
    OnDestroy,
    AfterViewInit,
    ViewChild,
    HostListener
} from '@angular/core';
import { GridsterConfig, GridType } from 'angular-gridster2';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel, DashboardContentModel } from '@app/models';
import { AuthenticationService, DashboardService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { IWidget, IWidgetMetaData } from '../widgets/IWidget';
import { Observable, Subscription } from 'rxjs';
import { WidgetArray, WidgetArrayInstance } from '@app/helpers/widget';
import { Functions } from '@app/helpers/functions';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '@app/services/data-time-range.service';
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UserSecurityService } from '@app/services/user-security.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    gridOptions: GridsterConfig;
    dashboardTitle: string;
    dashboardCollection: DashboardModel;
    dashboardArray: DashboardContentModel[];
    subscription: Subscription;
    isIframe = false;
    isHome = false;
    iframeUrl: string;
    postSaveHash: string;
    _interval: any;
    params: any;
    timeRange: Timestamp;

    gridLocked = false;
    isDashboardUpdate = true;
    isDashboardDelete = true;
    isShared = false;
    isSharedOwner = false;

    @ViewChildren('widgets') widgets: QueryList<IWidget>;
    @ViewChild('customWidget', {static: false}) customWidget: any;

    constructor (
        private _route: ActivatedRoute,
        private _ds: DashboardService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private _dtrs: DateTimeRangeService,
        private userSecurityService: UserSecurityService,
        private authenticationService: AuthenticationService,
        public dialog: MatDialog) {}
    @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        const ls = JSON.parse(localStorage.getItem('searchQueryWidgetsResult'));
        let currentWidget: any;
        if (ls != null && ls.currentWidget !== undefined) {
            currentWidget = ls.currentWidget;
        } else {
            currentWidget = this._ds.dbs.currentWidget;
        }
        if (currentWidget !== undefined) {
            if (event.key === 'Enter' && event.ctrlKey === true) {
                const w: IWidget = WidgetArrayInstance[currentWidget.id];
                if (w && w.doSearchResult) {
                    w.doSearchResult();
                }
            }
        }
        let widgetList: Array<any>;
        if (ls != null && ls.currentWidgetList !== undefined) {
            widgetList = ls.currentWidgetList;
        } else {
            widgetList = this._ds.dbs.currentWidgetList;
        }
        const firstWidget =  widgetList.findIndex(widget => widget.strongIndex === 'ProtosearchWidgetComponent');
        if (event.key === 'Tab' && event.shiftKey === true) {
            event.preventDefault();
            let i = 0;
            if (currentWidget !== undefined) {
                i = this.submitCheck().findIndex(widget => widget.id === currentWidget.id);
                if (i < this.submitCheck().length - 1) {
                    i += 1;
                } else {
                    i = 0;
                }
            } else {
                i = 0;
            }
            this._ds.setCurrentWidgetId(this.submitCheck()[i]);
        }
    }
    ngOnInit() {
        this.params = {
            refresh: '1h',
            from: 'now-5m', // 'now-5m',
            to: 'now', // 'now'
        };
        // Grid options
        this.gridOptions = {
            gridType: GridType.Fit,
            enableEmptyCellDrop: true,
            useTransformPositioning: true,
            mobileBreakpoint: 640,
            disableWindowResize: false,
            swap: true,
            swapWhileDragging: true,
            margin: 6,
            scrollSensitivity: 10,
            scrollSpeed: 20,
            resizable: {
                enabled: true
            },
            itemChangeCallback: this.itemChange.bind(this),
            itemResizeCallback: this.itemChange.bind(this),
            draggable: {
                enabled: true,
                ignoreContent: true,
                dropOverItems: true,
                dragHandleClass: 'drag-handler',
                ignoreContentClass: 'no-drag',
            },
            /* Pushing elements */
            pushItems: true,
            disablePushOnDrag: false,
            disablePushOnResize: false,
            pushResizeItems: true,
            pushDirections: { north: true, east: true, south: true, west: true },

            /*  */
            scrollToNewItems: true,
            displayGrid: 'none',
            cols: 5,
            rows: 5,
            minCols: 5,
            maxCols: 5,
            minRows: 5,
            maxRows: 5,
        };
        this.getData();
    }


    checkWidgets() {
        const widgets =  this._ds.dbs.currentWidgetList;
        const limitedWidgets = [];
        for (let i = 0 ; i < WidgetArray.length; i++) {
            if (WidgetArray[i].minHeight !== undefined && limitedWidgets.indexOf(WidgetArray[i]) === -1) {
                limitedWidgets.push(WidgetArray[i]);
            }
            if (WidgetArray[i].minWidth !== undefined  && limitedWidgets.indexOf(WidgetArray[i]) === -1) {
                limitedWidgets.push(WidgetArray[i]);
            }
        }
        for (let i = 0; i < widgets.length; i++) {
            for (let j = 0; j < limitedWidgets.length; j++) {
                if (widgets[i].strongIndex === limitedWidgets[j].strongIndex) {
                    this.checkSize(widgets[i].id, limitedWidgets[j]);
                }
            }
        }

    }
    checkSize(id, widgetType) {
        const widget = document.getElementById(id);
        if (widgetType.minWidth !== undefined && widgetType.minHeight !== undefined) {
            this.limitSize(id, widgetType.minHeight, widgetType.minWidth);
        } else if (widgetType.minHeight !== undefined) {
            this.limitSize(id, widgetType.minHeight, 1);
        } else if (widgetType.minWidth !== undefined) {
            this.limitSize(id, 1, widgetType.minWidth);
        }
    }
    limitSize(id, height, width) {
        let columnRes: number;
        let rowRes: number;
        const grid = document.getElementById('gridster');
        if (typeof grid === 'undefined' || grid === null) {
            return;
        }
        if (this.dashboardCollection.data.config !== undefined) {
            columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
            rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
        }
        if (this.dashboardCollection.data.config !== undefined && this.dashboardCollection.data.config.ignoreMinSize !== 'ignore') {
            const i = this.dashboardArray.findIndex(widget => widget.id === id);
            const colAmount = Math.ceil(width / columnRes);
            if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                this.dashboardArray[i].minItemRows = 1;
                this.dashboardArray[i].minItemCols = 1;
            }
            if (this.dashboardArray[i].rows < colAmount) {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'limit') {
                    this.dashboardArray[i].cols = colAmount;
                    this.dashboardArray[i].minItemCols = colAmount;
                } else if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[i].isWarning = true;
                }
            } else {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[i].isWarning = false;
                }
            }
            const rowAmount = Math.ceil(height / rowRes);
            if (this.dashboardArray[i].rows < rowAmount) {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'limit') {
                    this.dashboardArray[i].rows = rowAmount;
                    this.dashboardArray[i].minItemRows = rowAmount;
                } else if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[i].isWarning = true;
                }
            } else {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[i].isWarning = false;
                }
            }
        } else if (this.dashboardCollection.data.config !== undefined && this.dashboardCollection.data.config.ignoreMinSize === 'ignore') {
            for (let i = 0; i < this.dashboardArray.length; i++) {
                this.dashboardArray[i].minItemRows = 1;
                this.dashboardArray[i].minItemCols = 1;
            }
        }
        this.gridOptions.api.optionsChanged();
    }
    dismissWarning(item) {
        const i = this.dashboardArray.findIndex(widget => widget.id === item.id);
        this.dashboardArray[i].isDismissed = true;
    }
    resizeExcess() {
        let rows: number;
        let cols: number;
        if (this.dashboardCollection.data.config !== undefined) {
            rows = this.dashboardCollection.data.config.maxrows;
            cols = this.dashboardCollection.data.config.columns;
        }
        for (let i = 0; i < this.dashboardArray.length; i++) {
            if (this.dashboardArray[i].rows > rows || this.dashboardArray[i].cols > cols) {
                this.dashboardArray[i].rows = 1;
                this.dashboardArray[i].cols = 1;
                this.gridOptions.api.getNextPossiblePosition(this.dashboardArray[i]);
            }
        }
    }
    ngAfterViewInit () {
        this.updateTrigger();
    }
    scrollTop() {
        setTimeout(() => {
            const dom = document.querySelector('.scrollVertical');
            if (dom && dom.scrollTop) {
                dom.scrollTop = 0;
            } else {
                this.scrollTop();
            }
            Array.from(document.querySelectorAll('.widget-item')).forEach(i => i.scrollTop = 0);
        }, 100);
    }
    updateTrigger() {
        setTimeout(() => {
            const elList = document.body.querySelectorAll('.gridster-item-resizable-handler.ng-star-inserted');
            const shadows = Array.from(document.body.querySelectorAll('.widget-block .shadow-polygon'));
            Array.from(elList).forEach((i: any) => {
                i.onmouseup = window.document.body.onmouseleave = evt => shadows.forEach( (j: any) => j.style.display = 'none' );
                i.onmousedown = evt => shadows.forEach( (j: any) => j.style.display = 'block' );
            });
            this.cdr.detectChanges();
        },  100);
    }

    getData() {
        (async () => {
            this.isDashboardUpdate = await this.userSecurityService.isDashboardUpdate();
            this.isDashboardDelete = await this.userSecurityService.isDashboardDelete();
            this.cdr.detectChanges();
        })();
        this._route.params.subscribe(async (params) => {
            this._ds.setCurrentDashBoardId(params['id']);
            this.isHome = params['id'] === 'home';
            const dashboard = await this._ds.getDashboardStore(this._ds.getCurrentDashBoardId()).toPromise();
            if (dashboard == null) {
                return;
            }
            this.dashboardCollection = dashboard;

            this.isShared = dashboard.data.shared && dashboard.owner !== this.authenticationService.getUserName();
            this.isSharedOwner = dashboard.data.shared && dashboard.owner === this.authenticationService.getUserName();
            this.isIframe = this.dashboardCollection.data.type === 2;
            if (this.isIframe) {
                this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {

                    this.timeRange = this._dtrs.getDatesForQuery(true);
                    this.params.from = this.timeRange.from + '';
                    this.params.to = this.timeRange.to + '';
                    this.buildUrl();

                });
                if (!this.dashboardCollection.data.config.grafanaTimestamp) {
                    this.iframeUrl = this.dashboardCollection.data.param;
                }
            }
            this.dashboardTitle = this.dashboardCollection &&
                this.dashboardCollection.data ?
                    this.dashboardCollection.data.name : '';

            this.gridOptions.maxRows = this.gridOptions.minRows = 5;
            this.gridOptions.maxCols = this.gridOptions.minCols = 5;

            if (this.dashboardCollection) {
                if (this.dashboardCollection.data.config) {
                    ((g, c) => {
                        g.maxRows = g.minRows = c.maxrows || 5;
                        g.maxCols = g.minCols = c.columns || 5;
                        g.pushItems = !!c.pushing;
                        g.disablePushOnDrag = !c.pushing || g.disablePushOnDrag;
                        g.disablePushOnResize = !c.pushing || g.disablePushOnResize;
                        g.pushResizeItems = !!c.pushing;
                        g.gridType = c.gridType || g.gridType;
                    })(this.gridOptions, this.dashboardCollection.data.config);
                } else {
                    (g => { /** by default */
                        g.maxRows = g.minRows = 5;
                        g.maxCols = g.minCols = 5;
                        g.pushItems = true;
                        g.disablePushOnDrag = false;
                        g.disablePushOnResize = false;
                        g.pushResizeItems = true;
                        g.gridType = 'fit';
                    })(this.gridOptions);
                }
                this.changedOptions();
                this.dashboardArray = this.dashboardCollection.data.widgets;
            } else {
                this.dashboardArray = [];
            }
            this.dashboardArray.forEach(item => item.output = { changeSettings: this.onChangeWidget.bind(this) } );
            this.dashboardCollection.data.widgets = this.dashboardArray;
            this.dashboardCollection.data.widgets.forEach(item =>
                item.strongIndex = item.strongIndex || this.getWidgetItemClass(item).strongIndex);
            this._ds.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);

            if (this.isShared) {
                this.lockDashboard();
            }
            this.updateTrigger();
            this.changedOptions();
            this.scrollTop();
            this.cdr.detectChanges();
        });
    }
    buildUrl(noCache: boolean = false) {
        if (this.dashboardCollection.data.param === '' || typeof this.dashboardCollection.data.param === undefined
            || this.dashboardCollection.data.param === null || !this.dashboardCollection.data.config.grafanaTimestamp) {
            return;
        }
        this.iframeUrl = this.dashboardCollection.data.param;
        if (/from=\d+/.test(this.iframeUrl)) {
            this.iframeUrl = this.iframeUrl.replace(/from=\d+/, `from=${this.params.from}`)
        }
        if (/to=\d+/.test(this.iframeUrl)) {
            this.iframeUrl = this.iframeUrl.replace(/to=\d+/, `to=${this.params.to}`)
        }
        this.dashboardCollection.data.param = this.iframeUrl;

        this.cdr.detectChanges();
    }
    submitCheck() {
        const submitWidgets: Array<any> = [];
        const dashboardSubmitWidgets: Array<any> = [];
        const ls = JSON.parse(localStorage.getItem('searchQueryWidgetsResult'));
        let widgetList: Array<any>;
        if (ls != null && ls.currentWidgetList !== undefined) {
            widgetList = ls.currentWidgetList;
        } else {
            widgetList = this._ds.dbs.currentWidgetList;
        }
        for (let i = 0; i < WidgetArray.length; i++) {
            if (WidgetArray[i].submit) {
                submitWidgets.push(WidgetArray[i]);
            }
        }

        for (let i = 0; i < widgetList.length; i++) {
            for (let j = 0; j < submitWidgets.length; j++) {
                if (widgetList[i].strongIndex === submitWidgets[j].strongIndex) {
                    dashboardSubmitWidgets.push(widgetList[i]);
                }
            }
        }
        return dashboardSubmitWidgets;
    }
    changeCurrent(id: string) {
        const ls = JSON.parse(localStorage.getItem('searchQueryWidgetsResult'));
        let currentWidget: any;
        if (ls != null && ls.currentWidget !== undefined && ls.currentWidget !== '') {
            currentWidget = ls.currentWidget;
        } else {
            currentWidget = this._ds.dbs.currentWidget;
        }
        if (currentWidget === '' || typeof currentWidget === 'undefined' || (currentWidget.id && id !== currentWidget.id)) {
            const i = this.submitCheck().findIndex(widget => widget.id === id);
            if (i === -1) {
                return;
            }
            this._ds.setCurrentWidgetId(this.submitCheck()[i]);
            this.save();
        }
    }
    lockDashboard() {

        if (!this.gridLocked) {
            this.gridOptions.resizable = {
                enabled: false
            };

            this.gridOptions.draggable = {
                enabled: false,
                ignoreContent: false,
                dropOverItems: false,
                dragHandleClass: '',
                ignoreContentClass: 'no-drag',
            };

            this.gridOptions.pushDirections = {
                east: false,
                north: false,
                south: false,
                west: false
            };
            if (!this.isShared) {
                this.gridLocked = true;
            }
            this.gridOptions?.api?.optionsChanged();
            this.cdr.detectChanges();

        } else if (this.gridLocked) {
            this.gridOptions.resizable = {
                enabled: true
            };

            this.gridOptions.draggable = {
                enabled: true,
                ignoreContent: true,
                dropOverItems: true,
                dragHandleClass: 'drag-handler',
                ignoreContentClass: 'no-drag',
            };

            this.gridOptions.pushDirections = {
                east: true,
                north: true,
                south: true,
                west: true
            };

            this.gridLocked = false;
            this.gridOptions?.api?.optionsChanged();
            this.cdr.detectChanges();
        }
        this.save();
    }

    itemChange(item: any) {

        if (item.name === 'iframe') {
            const w: IWidget = WidgetArrayInstance[item.id];
            if (w && w.refresh) {
                w.refresh();
            }
        }
        this.warningCheck(item);
        this.save();
        return true;
    }
    warningCheck(item: any) {
        if (this.dashboardCollection.data.config !== undefined && this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
            let columnRes: number;
            let rowRes: number;
            const grid = document.getElementById('gridster');
            if (this.dashboardCollection.data.config !== undefined) {
                columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
                rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
            }
            const iW = WidgetArray.findIndex(widget => widget.strongIndex === item.strongIndex);
            const iD = this.dashboardArray.findIndex(widget => widget.id === item.id);
            const height = WidgetArray[iW].minHeight;
            const rowAmount = Math.ceil(height / rowRes);
            if (this.dashboardArray[iD].rows < rowAmount) {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[iD].isWarning = true;
                }
            }
            const width = WidgetArray[iW].minWidth;
            const colAmount = Math.ceil(width / columnRes);
            if (this.dashboardArray[iD].rows < colAmount) {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[iD].isWarning = true;
                }
            }
            if (this.dashboardArray[iD].rows >= colAmount && this.dashboardArray[iD].rows >= rowAmount) {
                if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
                    this.dashboardArray[iD].isWarning = false;
                    this.dashboardArray[iD].isWarning = false;
                }
            }
            this.cdr.detectChanges();
        }
    }
    getSize(item, onlyNum = false): any {
        const i = WidgetArray.findIndex(widget => widget.strongIndex === item.strongIndex);
        let size = '';
        let columnRes: number;
        let rowRes: number;
        let colAmount: number;
        let rowAmount: number;
        const grid = document.getElementById('gridster');
        if (this.dashboardCollection.data.config !== undefined) {
                columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
                rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
            }
        if (WidgetArray[i].minWidth !== undefined) {
            const width = WidgetArray[i].minWidth;
            colAmount = Math.ceil(width / columnRes);
            size += colAmount + ' columns ';
        }
        if (WidgetArray[i].minHeight !== undefined) {
            const height = WidgetArray[i].minHeight;
            rowAmount = Math.ceil(height / rowRes);
            size += rowAmount + ' rows ';

        }
        if (onlyNum) {
            return {
                cols: colAmount,
                rows: rowAmount
            };
        } else {
            return size;
        }
    }
    private save () {
        setTimeout(async () => await this.onDashboardSave().toPromise());
    }

    private changedOptions() {
        switch (this.gridOptions.gridType) {
            case 'scrollVertical':
                this.gridOptions.maxRows = Number.MAX_VALUE;
                break;
            case 'scrollHorizontal':
                this.gridOptions.maxCols = Number.MAX_VALUE;
                break;
            case 'verticalFixed':
                this.gridOptions.maxCols = Number.MAX_VALUE;
                break;
            case 'horizontalFixed':
                this.gridOptions.maxRows = Number.MAX_VALUE;
                break;
        }
        if (this.gridOptions && this.gridOptions.api && this.gridOptions.api.optionsChanged) {
            this.gridOptions.api.optionsChanged();
        }
        setTimeout(() => {
            this.resizeExcess();
            this.checkWidgets();
            this.cdr.detectChanges();
        }, 100);
    }

    openSettings(item: any) {
        const widget: IWidget = WidgetArrayInstance[item.id];
        widget.openDialog();
    }

    removeItem($event: any, item: any) {
        $event.preventDefault();
        $event.stopPropagation();

        this.dashboardArray = this.dashboardArray.filter( i => JSON.stringify(i) !== JSON.stringify(item));
        this.dashboardArray.forEach((i: any) => {
            i.output = {
                changeSettings: this.onChangeWidget.bind(this)
            };
        });
        this.save();
    }

    onChangeWidget({config, id}) {
        this.dashboardArray[this.dashboardArray.map(i => i.id).indexOf(id)].config = config;
        this.save();
    }

    async onDashboardAdd() {
        const data = await this.dialog.open(AddDialogComponent, { width: '600px', data: {} }).afterClosed().toPromise();

        if (!data) {
            return;
        }
        const { indexName, strongIndex, title } = data;
        const widget: DashboardContentModel = {
            x: 0, y: 0, cols: 1, rows: 1,
            name: indexName,
            id: indexName + (Math.random() * 1000).toFixed(0),
            strongIndex, title,
            output: { changeSettings: this.onChangeWidget.bind(this) }
        };
        const widgetSize = this.getSize(widget, true);
        widget.cols = widgetSize.cols;
        widget.rows = widgetSize.rows;
        if (!this.gridOptions.api.getNextPossiblePosition(widget)) {
            this.gridOptions.gridType = 'scrollVertical';
            this.dashboardCollection.data.config.gridType = 'scrollVertical';
            this.changedOptions();
            widget.x = this.gridOptions.api.getFirstPossiblePosition(widget).x;
            widget.y = this.gridOptions.api.getFirstPossiblePosition(widget).y;
        }
        this.dashboardArray.push(widget);
        this.save();
        this._ds.update();
        setTimeout(() => {
            this.checkWidgets();
            this.resizeExcess();
            this.cdr.detectChanges();
        }, 100);
    }
    onDownloadDashboardSettings() {
        Functions.saveToFile(JSON.stringify(this.dashboardCollection, null, 2), `${this.dashboardTitle}.json`);
    }
    async onDashboardSettings() {
        const _d = this.dashboardCollection.data = this.dashboardCollection.data || {};

        _d.config = _d.config || { pushing: true };

        const dialogRef = this.dialog.open(EditDialogComponent, { width: '650px', data: {
            name: this.dashboardTitle,
            type: _d.type,
            param: _d.param || '',
            shared: !!_d.shared,
            columns: _d.config.columns || 5,
            maxrows: _d.config.maxrows || 5,
            pushing: !!_d.config.pushing,
            grafanaTimestamp: _d.config.grafanaTimestamp,
            ignoreMinSize: _d.config.ignoreMinSize || 'warning',
            gridType: _d.config.gridType || GridType.Fit,
        }});
        dialogRef.componentInstance.export(this.onDownloadDashboardSettings.bind(this));

        const data = await dialogRef.afterClosed().toPromise();

        if (!data) {
            return;
        }

        ((d, dd) => {
            d.param = data.param;
            dd.param = data.param;
            dd.name = data.name;
            dd.type = data.type;
            dd.shared = data.shared;
            dd.config.columns = data.columns;
            dd.config.maxrows = data.maxrows;
            dd.config.pushing = data.pushing;
            dd.config.grafanaTimestamp = data.grafanaTimestamp;
            dd.config.ignoreMinSize = data.ignoreMinSize;
            dd.config.gridType = data.gridType;

            ((g, c) => {
                g.rows = g.maxRows = g.minRows = c.maxrows || 5;
                g.column = g.maxCols = g.minCols = c.columns || 5;
                g.pushItems = !!c.pushing;
                g.disablePushOnDrag = !c.pushing;
                g.disablePushOnResize = !c.pushing;
                g.pushResizeItems = !!c.pushing;
                g.gridType = c.gridType;

            })(this.gridOptions, dd.config);

            this.changedOptions();

        })(this.dashboardCollection, _d);
        this.onDashboardSave().toPromise().then(() => {
            this.getData();
            this._ds.update();
            this.resizeExcess();
            this.checkWidgets();
        });
        this.cdr.detectChanges();
    }

    async onDashboardDelete() {
        if (await this.dialog.open(DeleteDialogComponent, { width: '350px', data: {} }).afterClosed().toPromise()) {
            this._ds.deleteDashboardStore(this._ds.getCurrentDashBoardId()).toPromise().then(() => {
                this.router.navigateByUrl('/');
                this._ds.update();
                this.cdr.detectChanges();
            });
            this.cdr.detectChanges();
        }
    }

    onDashboardSave() {
        this.dashboardCollection.data.widgets = this.dashboardArray;
        this.dashboardCollection.data.isLocked = this.gridLocked;

        const _hash = Functions.md5(JSON.stringify(this.dashboardCollection));

        if (this.postSaveHash === _hash) {
            return new Observable();
        }

        this.postSaveHash = _hash;
        this._ds.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);

        return this._ds.updateDashboard(this.dashboardCollection.data);
    }

    ngOnDestroy() {
        clearInterval(this._interval);
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private getWidgetItemClass(item: DashboardContentModel): IWidgetMetaData {
        let wItem: IWidgetMetaData[];
        if (item.strongIndex) {
            wItem = WidgetArray.filter(i => i.strongIndex === item.strongIndex);
        } else {
            wItem = WidgetArray.filter(i => i.indexName === item.name );
        }
        return wItem[0];
    }

    getComponentWidget(item: any) {
        const w = this.getWidgetItemClass(item);
        return w ? w.componentClass : null;
    }

    public hesSettings(item: any): boolean {
        const w = this.getWidgetItemClass(item);
        return w ? w.settingWindow || false : false;
    }
}
