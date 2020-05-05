// GRIDSTER & ANGULAR
import { Component, OnInit, ViewEncapsulation, ViewChildren, QueryList, OnDestroy, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { GridsterConfig, GridType } from 'angular-gridster2';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel, DashboardContentModel } from '@app/models';
import { DashboardService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { IWidget, IWidgetMetaData } from '../widgets/IWidget';
import { Observable } from 'rxjs';
import { WidgetArray, WidgetArrayInstance } from '@app/helpers/widget';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    gridOptions: GridsterConfig;
    dashboardTitle: string;
    dashboardCollection: DashboardModel;
    dashboardArray: DashboardContentModel[];
    isIframe = false;
    isHome = false;
    iframeUrl: string;
    postSaveHash: string;
    _interval: any;
    @ViewChildren('widgets') widgets: QueryList<IWidget>;
    @ViewChild('customWidget', {static: false}) customWidget: any;

    constructor (
        private _route: ActivatedRoute,
        private _ds: DashboardService,
        private router: Router,
        public dialog: MatDialog) {}
    @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        if (event.key === "Enter" && event.ctrlKey === true) {
            const w: IWidget = WidgetArrayInstance[this._ds.dbs.currentWidget.id];
            if (w && w.doSearchResult) {
                w.doSearchResult();
            }

        }
        let widgets =  this._ds.dbs.currentWidgetList;
        let firstWidget =  widgets.findIndex(widget => widget.strongIndex === "ProtosearchWidgetComponent")
        if (event.key === "Tab" && event.shiftKey === true) {
            event.preventDefault();
            let i = widgets.findIndex(widget => widget.id === this._ds.dbs.currentWidget.id);
            if(i<this.submitCheck().length -1){
                i++;
            }else{
                i=0
            }
            this._ds.setCurrentWidgetId(this.submitCheck()[i]);
        } 
    }
    ngOnInit() {
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
            minCols: 5,
            maxCols: 5,
            minRows: 5,
            maxRows: 5,
        };
        this.getData();
    }
    checkWidgets(){
            let widgets =  this._ds.dbs.currentWidgetList;
            let limitedWidgets = [];
            for(let i=0;i<WidgetArray.length;i++){
                if(WidgetArray[i].minHeight != undefined && limitedWidgets.indexOf(WidgetArray[i]) === -1){
                    limitedWidgets.push(WidgetArray[i]);
                }
                if(WidgetArray[i].minWidth != undefined  && limitedWidgets.indexOf(WidgetArray[i]) === -1){
                    limitedWidgets.push(WidgetArray[i]);
                }
            }
            for(let i=0;i<widgets.length;i++){
                for(let j=0;j<limitedWidgets.length;j++){
                    if(widgets[i].strongIndex === limitedWidgets[j].strongIndex){
                        this.checkSize(widgets[i].id,limitedWidgets[j]);
                    }
                }
            }

    }
    checkSize(id,widgetType){
        let widget = document.getElementById(id);
        if (widgetType.minWidth != undefined && widgetType.minHeight != undefined) {
            this.limitSize(id,widgetType.minHeight,widgetType.minWidth);
        }else if(widgetType.minHeight != undefined){
            this.limitSize(id,widgetType.minHeight,1);
        }else if(widgetType.minWidth != undefined){
            this.limitSize(id,1,widgetType.minWidth);
        };
    }
    limitSize(id,height,width){
        if(this.dashboardCollection.data.config.ignoreMinSize === false){
            let grid = document.getElementById('gridster');
            let columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
            let rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
            let i = this.dashboardArray.findIndex(widget => widget.id === id);
            let colAmount = Math.ceil(width/columnRes);
            this.dashboardArray[i].cols=colAmount
            this.dashboardArray[i].minItemCols=colAmount;
            let rowAmount = Math.ceil(height/rowRes);
            this.dashboardArray[i].rows=rowAmount;
            this.dashboardArray[i].minItemRows=rowAmount;
        }else{
            for(let i = 0; i<this.dashboardArray.length;i++){
                this.dashboardArray[i].minItemRows=1;
                this.dashboardArray[i].minItemCols=1;
            }
        }
        this.gridOptions.api.optionsChanged();
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
        }, 500);
    }

    getData() {
        this._route.params.subscribe(async (params) => {
            this._ds.setCurrentDashBoardId(params['id']);
            this.isHome = params['id'] === 'home';
            const dashboard = await this._ds.getDashboardStore(this._ds.getCurrentDashBoardId()).toPromise();
            if (dashboard == null) {
                return;
            }
            this.dashboardCollection = dashboard;

            this.isIframe = this.dashboardCollection.data.type === 2;
            if (this.isIframe) {
                this.iframeUrl = this.dashboardCollection.data.param;
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
            this.updateTrigger();
            this.changedOptions();
            this.scrollTop();
        });
    }
    submitCheck(){
        let submitWidgets = [];
        let dashboardSubmitWidgets = [];
        for(let i = 0; i<WidgetArray.length;i++){
            if(WidgetArray[i].submit){
                submitWidgets.push(WidgetArray[i]);
            }
        }
        for(let i=0; i<this._ds.dbs.currentWidgetList.length;i++){
            for(let j=0; j<submitWidgets.length;j++){
                if(this._ds.dbs.currentWidgetList[i].strongIndex === submitWidgets[j].strongIndex){
                    dashboardSubmitWidgets.push(this._ds.dbs.currentWidgetList[i])
                }
            }
        }
        return dashboardSubmitWidgets;
    }
    changeCurrent(id:string){
        for(let i = 0; i<this.submitCheck().length; i++){
            if(id===this.submitCheck()[i].id){
                this._ds.setCurrentWidgetId(this.submitCheck()[i]);
            }
        }
    }
    itemChange(item: any) {
        if (item.name === 'iframe') {
            const w: IWidget = WidgetArrayInstance[item.id];
            if (w && w.refresh) {
                w.refresh();
            }
        }
        this.save();
        return true;
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
        this.gridOptions.api.optionsChanged();
        setTimeout(() => {
            this.checkWidgets();
        },100);
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
        this.dashboardArray.push(widget);
        this.save();
        this._ds.update();
        setTimeout(() => {
            this.checkWidgets();
        },100);
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
            ignoreMinSize: _d.config.ignoreMinSize || false,
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
            dd.config.ignoreMinSize = data.ignoreMinSize;
            dd.config.gridType = data.gridType;

            ((g, c) => {
                g.maxRows = g.minRows = c.maxrows || 5;
                g.maxCols = g.minCols = c.columns || 5;
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
        });
        setTimeout(() => {
            this.checkWidgets();
        },100);
    }

    async onDashboardDelete() {
        if (await this.dialog.open(DeleteDialogComponent, { width: '350px', data: {} }).afterClosed().toPromise()) {
            this._ds.deleteDashboardStore(this._ds.getCurrentDashBoardId()).toPromise().then(() => {
                this.router.navigateByUrl('/');
                this._ds.update();
            });
        }
    }

    onDashboardSave() {
        this.dashboardCollection.data.widgets = this.dashboardArray;

        const _hash = Functions.md5(JSON.stringify(this.dashboardCollection));

        if (this.postSaveHash === _hash) {
            return new Observable();
        }

        this.postSaveHash = _hash;
        this._ds.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);

        return this._ds.postDashboardStore(this._ds.getCurrentDashBoardId(), this.dashboardCollection.data);
    }

    ngOnDestroy() {
        clearInterval(this._interval);
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
