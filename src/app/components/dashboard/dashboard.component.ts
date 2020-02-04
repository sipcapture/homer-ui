// GRIDSTER & ANGULAR
import { Component, OnInit, ViewEncapsulation, ViewChildren, QueryList, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { GridsterConfig, GridType } from 'angular-gridster2';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel, DashboardContentModel } from '@app/models';
import { DashboardService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { IWidget } from '../widgets/IWidget';
import { Observable } from 'rxjs';
import { WidgetArray, WidgetArrayInstance } from '@app/helpers/widget';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
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
    @ViewChildren('widgets') widgets: QueryList<IWidget>;
    @ViewChild('customWidget', {static: false}) customWidget: any;
    constructor (
        private _route: ActivatedRoute,
        private _ds: DashboardService,
        private router: Router,
        public dialog: MatDialog) {}

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
            /* Pushig elements */
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
        }, 100)
    }
    updateTrigger() {
        setTimeout(() => {
            const elList = document.body.querySelectorAll('.gridster-item-resizable-handler.ng-star-inserted');
            const shadows = Array.from(document.body.querySelectorAll('.widget-block .shadow-polygon'));
            Array.from(elList).forEach((i: any) => {
                i.onmouseup = window.document.body.onmouseleave = e => {
                    shadows.forEach( (j: any) => {
                        j.style.display = 'none';
                    });
                };
                i.onmousedown = e => {
                    shadows.forEach( (j: any) => {
                        j.style.display = 'block';
                    });
                };
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

            if (this.dashboardCollection) {
                if (this.dashboardCollection.data.config) {
                    ((g, c) => {
                        g.maxRows = g.minRows = c.maxrows;
                        g.maxCols = g.minCols = c.columns;
                        g.pushItems = c.pushing;
                        g.disablePushOnDrag = !c.pushing;
                        g.disablePushOnResize = !c.pushing;
                        g.pushResizeItems = c.pushing;
                        g.gridType = c.gridType;
                    })(this.gridOptions, this.dashboardCollection.data.config);
                    this.changedOptions();
                }
                this.dashboardArray = this.dashboardCollection.data.widgets;
            } else {
                this.dashboardArray = [];
            }
            this.dashboardArray.forEach(item => {
                item.output = {
                    changeSettings: this.onChangeWidget.bind(this)
                };
            });
            this.dashboardCollection.data.widgets = this.dashboardArray;
            this.dashboardCollection.data.widgets.forEach(item => {
                item.strongIndex = item.strongIndex || this.getWidgetItemClass(item).strongIndex;
            });
            this._ds.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);

            this.updateTrigger();

            this.changedOptions();
            this.scrollTop();
        });
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
    }

    openSettings(item: any) {
        console.log('openSettings::id:', item.id);
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
        const dialogRef = this.dialog.open(AddDialogComponent, {
            width: '600px',
            data: {}
        });
        try {
            const {indexName, strongIndex, title} = await dialogRef.afterClosed().toPromise();
            if (indexName || strongIndex) {
                const widget: DashboardContentModel = {
                    x: 0, y: 0, cols: 1, rows: 1,
                    name: indexName, title: title,
                    id: indexName + (Math.random() * 1000).toFixed(0),
                    strongIndex: strongIndex,
                    output: { changeSettings: this.onChangeWidget.bind(this) }
                };
                this.dashboardArray.push(widget);

                this.save();

                this._ds.update();
            }
        } catch (err) {
        }
    }
    onDownloadDashboardSettings() {
        Functions.saveToFile(JSON.stringify(this.dashboardCollection, null, 2), `${this.dashboardTitle}.json`);
    }
    onDashboardSettings() {
        const _d = this.dashboardCollection.data = this.dashboardCollection.data || {};
        _d.config = _d.config || {
            pushing: true
        };

        const dialogRef = this.dialog.open(EditDialogComponent, {
            width: '650px',
            data: {
                name: this.dashboardTitle,
                type: _d.type,
                param: _d.param || '',
                shared: !!_d.shared,
                columns: _d.config.columns || 5,
                maxrows: _d.config.maxrows || 5,
                pushing: !!_d.config.pushing,
                gridType: _d.config.gridType || GridType.Fit,
            }
        });
        dialogRef.componentInstance.export(this.onDownloadDashboardSettings.bind(this));
        const dialogRefSubscription = dialogRef.afterClosed().subscribe( (data) => {
            if (data) {
                ((d, dd) => {
                    d.param = data.param;
                    dd.param = data.param;
                    dd.name = data.name;
                    dd.type = data.type;
                    dd.shared = data.shared;
                    dd.config.columns = data.columns;
                    dd.config.maxrows = data.maxrows;
                    dd.config.pushing = data.pushing;
                    dd.config.gridType = data.gridType;

                    ((g, c) => {
                        g.maxRows = g.minRows = c.maxrows;
                        g.maxCols = g.minCols = c.columns;
                        g.pushItems = c.pushing;
                        g.disablePushOnDrag = !c.pushing;
                        g.disablePushOnResize = !c.pushing;
                        g.pushResizeItems = c.pushing;
                        g.gridType = c.gridType;

                    })(this.gridOptions, dd.config);

                    this.changedOptions();

                })(this.dashboardCollection, _d);

                const subscription = this.onDashboardSave().subscribe(() => {
                    subscription.unsubscribe();
                    this.getData();
                    this._ds.update();
                });
            }

            dialogRefSubscription.unsubscribe();
        });
    }

    onDashboarDelete() {
        const dialogRef = this.dialog.open(DeleteDialogComponent, {
            width: '350px',
            data: {}
        });

        const dialogRefSubscription = dialogRef.afterClosed().subscribe( (data) => {
            if (data) {
                const deleteDashboardStoreSubscription = this._ds.deleteDashboardStore(this._ds.getCurrentDashBoardId()).subscribe(() => {
                    deleteDashboardStoreSubscription.unsubscribe();
                    this.router.navigateByUrl('/');
                    this._ds.update();
                });
            }
            dialogRefSubscription.unsubscribe();
        });
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
        // this.subscription.unsubscribe();
    }

    private getWidgetItemClass(item: DashboardContentModel) {
        let wItem;
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
