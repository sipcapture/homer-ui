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
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef
} from '@angular/core';
import {
  DashboardService,
  PreferenceAdvancedService,
  // PreferenceMappingProtocolService,
  SessionStorageService
} from '@app/services';

import { GridsterConfig, GridType } from 'angular-gridster2';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel, DashboardContentModel } from '@app/models';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { AddDialogComponent } from './add-dialog/add-dialog.component';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { ShareQrDialogComponent } from './share-qr-dialog/share-qr-dialog.component';
import { IWidget, IWidgetMetaData } from '../widgets/IWidget';
import { Observable, Subscription } from 'rxjs';
import { WidgetArray, WidgetArrayInstance } from '@app/helpers/widget';
import { Functions, log, setStorage } from '@app/helpers/functions';
import { ConstValue, UserConstValue } from '../../models/const-value.model';
import { DateTimeRangeService, DateTimeTick, Timestamp } from '@app/services/data-time-range.service';
import { UserSecurityService } from '@app/services/user-security.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { environment } from '@environments/environment';
import { TranslateService } from '@ngx-translate/core'


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  private envUrl = `${environment.apiUrl.replace('/api/v3', '')}`;
  gridOptions: GridsterConfig;
  dashboardTitle: string;
  dashboardOwner: string;
  dashboardCollection: DashboardModel;
  dashboardArrayTabs: any = [];
  _dashboardArray: DashboardContentModel[];
  _route_paramsSubscription: Subscription;
  routingParams: any;
  boolForRefresh = true;
  set dashboardArray(val: DashboardContentModel[]) {
    this._dashboardArray = val;

    this.dashboardArrayTabs = Object.values(this._dashboardArray.reduce((a, b) => {
      if (!b) {
        return a;
      }
      // add minsize of current widget to main widget container
      b.tabGroup = b.tabGroup || `tabIndex-${Math.ceil(Math.random() * 999999)}`;

      const { tabGroup } = b;

      if (!a[tabGroup]) {
        a[tabGroup] = [];
      }
      a[tabGroup].push(b);

      return a;
    }, []));

    this._sss.updateDataFromLocalStorage();
  }
  get dashboardArray(): DashboardContentModel[] {
    return this._dashboardArray;
  }
  subscription: Subscription;
  isIframe = false;
  isIframeLoaded: boolean = false;
  isSameOrigin: boolean = false;
  iframeUrl: string;
  isHome = false;
  postSaveHash: string;
  _interval: any;
  params: any;
  timeRange: Timestamp;
  gridLocked = false;
  isDashboardUpdate = true;
  isDashboardDelete = true;
  isShared = false;
  isSharedOwner = false;
  prevDash: any;
  prevWidgArray: any;
  tabsObj: any;
  isQrShare = true;
  qrElementType = NgxQrcodeElementTypes.URL;
  qrCorrectionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  qrValue = '';
  isLoaded = false;
  isFirstLoadOfDashboard = true;
  timeout: any;
  resizeTimeout: any;
  searchTabConfig = {};
  brandSrc;
  @ViewChildren('widgets') widgets: QueryList<IWidget>;
  @ViewChild('customWidget', { static: false }) customWidget: any;
  @ViewChild('gridster', { static: false }) gridster: any;
  @ViewChild('frame', { static: false }) frame: ElementRef;
  @HostListener('window:resize')
  onResize() {
    if (typeof this.gridster !== 'undefined' && this.gridster !== null) {
      if (typeof this.resizeTimeout !== 'undefined') {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.updateRowRatio(); // Align Grid to the screen size
        this.releaseWidgets();
      }, 500);
    }
  }

  constructor(
    private _route: ActivatedRoute,
    public dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private _dtrs: DateTimeRangeService,
    private _pas: PreferenceAdvancedService,
    private userSecurityService: UserSecurityService,
    private _sss: SessionStorageService,
    private authenticationService: AuthenticationService,
    public dialog: MatDialog,
    public translateService: TranslateService
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
    const browserLang = translateService.getBrowserLang();
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    let ls: any;
    try {
      ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.SQWR)) ||
        Functions.JSON_parse(localStorage.getItem(ConstValue.SQWR));
    } catch (err) {
      ls = null;
    }
    let currentWidget: any;
    if (ls != null && ls.currentWidget !== undefined) {
      currentWidget = ls.currentWidget;
    } else {
      currentWidget = this.dashboardService.dbs.currentWidget;
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
      widgetList = this.dashboardService.dbs.currentWidgetList;
    }
    const firstWidget = widgetList.findIndex(widget => widget.strongIndex === 'ProtosearchWidgetComponent');
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
      this.dashboardService.setCurrentWidgetId(this.submitCheck()[i]);
    }
  }

  ngOnInit() {
    this.isSameOrigin = this.envUrl === `${window.location.protocol}//${window.location.host}`;
    // Grid options
    this.params = {
      refresh: '1h',
      from: 'now-5m', // 'now-5m',
      to: 'now', // 'now'
    };

    this.gridOptions = {
      gridType: GridType.Fit,
      enableEmptyCellDrop: true,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      disableWindowResize: false,
      swap: true,
      swapWhileDragging: true,
      margin: 6,

      allowMultiLayer: true,
      defaultLayerIndex: 2,
      baseLayerIndex: 2,
      maxLayerIndex: 2,

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
      scrollToNewItems: true,

      // displayGrid: 'onDrag&Resize',
      displayGrid: 'none',
      minCols: 33,
      // maxCols: 33,
      minRows: 33,
      // maxRows: 33,
    };
    const gC = this.gridOptions;
    this.gridOptions.fixedColWidth = (window.outerWidth - (6 * gC.minCols)) / (gC.minCols);
    this.gridOptions.fixedRowHeight = window.outerHeight / gC.minRows;
    this._route_paramsSubscription = this._route.params.subscribe((params: any) => {
      this.getData(params);
      this.dashboardService.dashboardBack.subscribe(({ id, type }) => {
        const collectionItem: DashboardContentModel[] = this.dashboardArray;
        const item: DashboardContentModel = collectionItem?.find(i => i.id === id);
        if (item) {
          this.setActive(item, collectionItem, type);
        }
      });
    });
  }

  checkWidgets() {
    const widgets = this.dashboardService.dbs.currentWidgetList;
    const limitedWidgets = [];
    WidgetArray.forEach(w => {
      const noSetLimit = limitedWidgets.indexOf(w) === -1;
      if ((w.minHeight || w.minWidth) && noSetLimit) {
        limitedWidgets.push(w);
      }
    });

    widgets?.forEach(({ id, strongIndex }: any) => {
      const lw = limitedWidgets?.find(i => i.strongIndex === strongIndex);
      if (lw) {
        this.checkSize(id, lw);
      }
    });

  }

  checkSize(id, widgetType) {
    // const widget = document.getElementById(id);
    if (widgetType.minWidth !== undefined && widgetType.minHeight !== undefined) {
      this.limitSize(id, widgetType.minHeight, widgetType.minWidth);
    } else
      if (widgetType.minHeight !== undefined) {
        this.limitSize(id, widgetType.minHeight, 1);
      } else
        if (widgetType.minWidth !== undefined) {
          this.limitSize(id, 1, widgetType.minWidth);
        }
  }

  limitSize(id, height, width) {
    const grid = document.getElementById('gridster');
    const { config } = this.dashboardCollection.data;

    if (!config || !grid) {
      return;
    }

    let columnRes: number;
    let rowRes: number;
    const isWARNING = this.dashboardCollection.data.config.ignoreMinSize === 'warning';
    const rect = grid.getBoundingClientRect();

    columnRes = rect.width / config.columns;
    rowRes = rect.height / config.maxrows;

    if (config.ignoreMinSize !== 'ignore' && this.dashboardArray?.length) {
      const widget = this.dashboardArray.find(w => w.id === id);

      const colAmount = Math.ceil(width / columnRes);
      if (this.dashboardArray?.length === 0 || !widget) {
        return;
      }

      if (widget.rows < colAmount) {
        if (config.ignoreMinSize === 'limit') {
          widget.cols = colAmount;
        } else if (isWARNING) {
          widget.isWarning = true;
        }
      } else if (isWARNING) {
        widget.isWarning = false;
      }

      const rowAmount = Math.ceil(height / rowRes);

      if (isWARNING) {
        widget.isWarning = widget.rows < rowAmount;
      }
    }
    this.gridOptions?.api?.optionsChanged();

  }
  dismissWarning(item) {
    const i = this.dashboardArray.findIndex(widget => widget.id === item.id);
    this.dashboardArray[i].isDismissed = true;
  }
  resizeExcess() {
    const { maxrows, columns } = this.dashboardCollection?.data?.config || {};
    const rows: number = maxrows;
    const cols: number = columns;

    this.dashboardArray?.forEach(item => {
      if (item.rows > rows || item.cols > cols) {
        item.rows = 1;
        item.cols = 1;
        this.gridOptions?.api?.getNextPossiblePosition(item);
      }
    });
  }
  ngAfterViewInit() {
    /* get company logo if exists
    on advanced setting
     category: company | param: brand  json: {"src":[image link]} */

    this._pas.getSetting('brand', 'company').then(data => {
      this.brandSrc = data?.[0]?.src;
      this.cdr.detectChanges();
    });

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
        i.onmouseup = window.document.body.onmouseleave = evt => {
          clearTimeout(this.timeout);
          shadows.forEach((j: any) => j.style.display = 'none');
        };
        i.onmousedown = evt => {
          shadows.forEach((j: any) => j.style.display = 'block');
          this.timeout = setTimeout(() => {
            shadows.forEach((j: any) => j.style.display = 'none');
          }, 5000);
        };
      });
      Functions.emitWindowResize();
    }, 500);
    Functions.emitWindowResize();
  }
  releaseWidgets() {
    setTimeout(() => {
      this.gridOptions.resizable.enabled = false;
      this.changedOptions();
      setTimeout(() => {
        this.gridOptions.resizable.enabled = true;
        this.changedOptions();
      }, 1000);
    }, 3000);
  }
  onDataReady() {
    this.isLoaded = true;
    setTimeout(() => {
      Functions.emitWindowResize();
    });
  }
  async getData(routingParams: any = null) {
    this.routingParams = routingParams || this.routingParams;
    const params = this.routingParams;

    /** test userSecurityService */
    this.isDashboardUpdate = await this.userSecurityService.isDashboardUpdate();
    this.isDashboardDelete = await this.userSecurityService.isDashboardDelete();

    const username = this.authenticationService.getUserName();
    this.isFirstLoadOfDashboard = true;
    this.dashboardService.setCurrentDashBoardId(params?.id);

    this.isHome = params?.id === 'home';
    const dashboard = await this.dashboardService.getDashboardStore(this.dashboardService.getCurrentDashBoardId()).toPromise();
    if (dashboard == null) {
      return;
    }
    this.dashboardCollection = dashboard;
    this.dashboardService.dbs.currentDashboardType = dashboard.data?.type;
    this.dashboardService.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);
    if (dashboard.data.shared === 0 && dashboard.owner === username) {
      dashboard.data.shared = false;
    }
    this.isShared = dashboard.data.shared && dashboard.owner !== username;
    this.isSharedOwner = dashboard.data.shared && dashboard.owner === username;
    this.isIframe = this.dashboardCollection.data.type === 2 || this.dashboardCollection.data.type === 7;
    if (this.isIframe) {
        this.deleteAllWidgets();
    }
    if (this.isIframe) {
      if (!this.subscription) {
        this.subscription = this._dtrs.castRangeUpdateTimeout.subscribe((dtr: DateTimeTick) => {
          this.timeRange = this._dtrs.getDatesForQuery(true);
          this.params.from = this.timeRange.from + '';
          this.params.to = this.timeRange.to + '';
          this.buildUrl();
        });
      }
      if (!this.dashboardCollection.data.config.grafanaTimestamp && !this.dashboardCollection.data.config.grafanaProxy) {
        this.iframeUrl = this.dashboardCollection.data.param;
      }
    }
    this.dashboardTitle = this.dashboardCollection?.data?.name || '';
    this.dashboardOwner = this.dashboardCollection?.owner;
    if (this.dashboardCollection?.data?.isLocked) {
      this.lockDashboard();
    }

    this.gridOptions.maxRows = this.gridOptions.minRows = 33;
    this.gridOptions.maxCols = this.gridOptions.minCols = 33;

    if (this.dashboardCollection) {
      if (this.dashboardCollection.data.config) {
        ((g, c) => {
          g.maxRows = g.minRows = c.maxrows || 33;
          g.maxCols = g.minCols = c.columns || 33;
          g.pushItems = !!c.pushing;
          g.disablePushOnDrag = !c.pushing || g.disablePushOnDrag;
          g.disablePushOnResize = !c.pushing || g.disablePushOnResize;
          g.pushResizeItems = !!c.pushing;
          g.gridType = c.gridType || g.gridType;
        })(this.gridOptions, this.dashboardCollection.data.config);
      } else {
        (g => { /** by default */
          // g.maxRows = g.minRows = 6;
          // g.maxCols = g.minCols = 8;
          g.pushItems = true;
          g.disablePushOnDrag = false;
          g.disablePushOnResize = false;
          g.pushResizeItems = true;
          g.gridType = 'fit';
        })(this.gridOptions);
      }

      this.changedOptions();
      if(!this.isIframe) {
        this.dashboardArray = this.dashboardCollection.data.widgets;
      }
    } else {
      this.dashboardArray = [];
    }
    if (this.dashboardArray?.length) {
      this.dashboardArray.forEach(item => item.output = {
        changeSettings: this.onChangeWidget.bind(this),
        deleteWidget: this.removeItem.bind([null, this])
      });
      this.dashboardCollection.data.widgets = this.dashboardArray;


      this.dashboardCollection?.data?.widgets?.forEach(item => {
        item.strongIndex = item?.strongIndex || this.getWidgetItemClass(item)?.strongIndex

      });

      if (this.isShared) {
        this.lockDashboard();
      }
      this.updateRowRatio();
      this.updateTrigger();
      this.changedOptions();
      this.scrollTop();
      this.cdr.detectChanges();
    }
    if (this.isIframe) {
      this.buildUrl();
    }
  }
  buildUrl() {
    if (!this.dashboardCollection?.data?.param) {
        return;
    }
    if (this.dashboardCollection.data.config.grafanaTimestamp) {
        if (/from=\d*/.test(this.dashboardCollection.data.param)) {
            this.dashboardCollection.data.param =
                this.dashboardCollection.data.param.replace(
                    /from=\d*/,
                    `from=${this.params.from}`
                );
        } else {
            this.dashboardCollection.data.param += `&from=${this.params.from}`;
        }
        if (/to=\d*/.test(this.dashboardCollection.data.param)) {
            this.dashboardCollection.data.param =
                this.dashboardCollection.data.param.replace(
                    /to=\d*/,
                    `to=${this.params.to}`
                );
        } else {
            this.dashboardCollection.data.param += `&to=${this.params.to}`;
        }
        if (!/&kiosk/.test(this.dashboardCollection.data.param)) {
            this.dashboardCollection.data.param += `&kiosk`;
        }
    }
    this.iframeUrl = '';
    this.cdr.detectChanges();
    if (this.dashboardCollection.data.config.grafanaProxy) {
        const currentUser = this.authenticationService.currentUserValue;
        const shortToken = currentUser.token.slice(currentUser.token.length - 15);
        const url = new URL(this.dashboardCollection.data.param);
        let formattedUrl = `${url.pathname}${url.search}`;
        if (this.isSameOrigin && this.dashboardCollection.data.config.hasVariables ) {
            formattedUrl = formattedUrl.replace('/d-solo/', '/d/').replace('&kiosk',`&kiosk=full`);
        }
        this.iframeUrl = `${this.envUrl}${formattedUrl}&JWT=${shortToken}`;
        console.log(url)
    } else {
        this.iframeUrl = this.dashboardCollection.data.param;
    }

    this.cdr.detectChanges();
}
  submitCheck() {
    const submitWidgets: Array<any> = [];
    const dashboardSubmitWidgets: Array<any> = [];
    const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.SQWR)) ||
      Functions.JSON_parse(localStorage.getItem(ConstValue.SQWR));
    let widgetList: Array<any>;
    if (ls != null && ls.currentWidgetList !== undefined) {
      widgetList = ls.currentWidgetList;
    } else {
      widgetList = this.dashboardService.dbs.currentWidgetList;
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
    const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.SQWR)) ||
      Functions.JSON_parse(localStorage.getItem(ConstValue.SQWR));
    let currentWidget: any;
    if (ls != null && ls.currentWidget !== undefined && ls.currentWidget !== '') {
      currentWidget = ls.currentWidget;
    } else {
      currentWidget = this.dashboardService.dbs.currentWidget;
    }
    if (currentWidget === '' || typeof currentWidget === 'undefined' || (currentWidget.id && id !== currentWidget.id)) {
      const widget = this.submitCheck().find(_widget => _widget.id === id);
      if (!widget) {
        return;
      }
      this.dashboardService.setCurrentWidgetId(widget);
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
      if (w?.refresh) {
        w.refresh();
      }
    }

    this.warningCheck(item);
    this.save();
    return true;
  }

  warningCheck(item: any) {
    if (this.dashboardCollection?.data?.config?.ignoreMinSize === 'warning' && this.dashboardArray) {
      let columnRes: number;
      let rowRes: number;
      const grid = document.getElementById('gridster');
      if (this.dashboardCollection.data.config !== undefined) {
        columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
        rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
      }
      const iW = WidgetArray.findIndex(widget => widget.strongIndex === item.strongIndex) || 0;
      const iD = this.dashboardArray.findIndex(widget => widget.id === item.id) || 1;
      const height = WidgetArray[iW] ? WidgetArray[iW].minHeight : 300;

      const rowAmount = Math.ceil(height / rowRes);
      if (this.dashboardArray[iD] && this.dashboardArray[iD].rows < rowAmount) {
        if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
          this.dashboardArray[iD].isWarning = true;
        }
      }

      const width = WidgetArray[iW] ? WidgetArray[iW].minWidth : 300;
      const wSize = { minWidth: width, minHeight: height };

      /* widget resize on */
      const { maxCols, maxRows, minRows, minCols, gridType } = this.gridOptions;
      const winHeight = window.innerHeight;
      const winWidth = window.innerWidth;
      const cellWidth = (winWidth / maxCols) - 6;
      const cellHeight = Math.round((winHeight / Math.round(minRows)) - 6);
      const { minHeight, minWidth } = wSize;

      const colAmount = Math.ceil(width / columnRes);
      if (this.dashboardArray[iD] && this.dashboardArray[iD].rows < colAmount) {
        if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {
          this.dashboardArray[iD].isWarning = true;
        }
      }
      if (this.dashboardArray[iD] && this.dashboardArray[iD].rows >= colAmount && this.dashboardArray[iD].rows >= rowAmount) {
        if (this.dashboardCollection.data.config.ignoreMinSize === 'warning') {

          this.dashboardArray[iD].isWarning = false;
          this.dashboardArray[iD].isWarning = false;
        }
      }
      this.cdr.detectChanges();
    }
  }


  getSize(item) {
    const i = WidgetArray.findIndex(widget => widget.strongIndex === item.strongIndex);
    let size = '';
    let columnRes: number;
    let rowRes: number;
    const grid = document.getElementById('gridster');
    if (this.dashboardCollection.data.config !== undefined) {
      columnRes = grid.getBoundingClientRect().width / this.dashboardCollection.data.config.columns;
      rowRes = grid.getBoundingClientRect().height / this.dashboardCollection.data.config.maxrows;
    }
    if (WidgetArray[i] && WidgetArray[i].minWidth !== undefined) {
      const width = WidgetArray[i].minWidth;
      const colAmount = Math.ceil(width / columnRes);
      size += colAmount + ' columns ';
    }
    if (WidgetArray[i] && WidgetArray[i].minHeight !== undefined) {
      const height = WidgetArray[i].minHeight;
      const rowAmount = Math.ceil(height / rowRes);
      size += rowAmount + ' rows ';
    }

    return size;
  }
  private save() {
    if (this.isShared) {
      this.dashboardService.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);
      return;
    }
    setTimeout(async () => {
      try {

        await this.onDashboardSave().toPromise();
        this.cdr.detectChanges();
      } catch (err) { }
    });
  }

  private changedOptions() {
    switch (this.gridOptions.gridType) {
      case 'scrollVertical':
        this.gridOptions.maxRows = Number.MAX_VALUE;
        this.updateRowRatio();
        break;
      case 'scrollHorizontal':
        this.gridOptions.maxCols = Number.MAX_VALUE;
        this.updateRowRatio();
        break;
      case 'verticalFixed':
        this.gridOptions.maxCols = Number.MAX_VALUE;
        break;
      case 'horizontalFixed':
        this.gridOptions.maxRows = Number.MAX_VALUE;
        break;
    }
    this.gridOptions?.api?.optionsChanged();
    setTimeout(() => {
      if (!this.isIframe) {
        this.resizeExcess();
        this.checkWidgets();
      }
    }, 100);
  }

  openSettings(item: any) {
    const widget: IWidget = WidgetArrayInstance[item.id];
    widget.openDialog();
  }
  deleteAllWidgets() {
    const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.USER_SETTINGS));
    this.dashboardArray?.forEach(widget => {
      if (widget.strongIndex === 'ResultWidgetComponent') {
        const lsIndexUser = UserConstValue.RESULT_STATE;
        localStorage.removeItem(`${lsIndexUser}-${widget.id}`);
      } else if (widget.strongIndex === 'ProtosearchWidgetComponent') {
        if (ls !== null) {
          delete ls.protosearchSettings[widget.id];
        }
      }
    });
    setStorage(UserConstValue.USER_SETTINGS, ls);
    this.dashboardArray = [];
    this.save();
  }
  tileWidgets() {
    if (this.gridOptions.gridType === GridType.VerticalFixed || this.gridOptions.gridType === GridType.HorizontalFixed) {
      return;
    }
    const widgetCount = this.dashboardArray.length;
    const widgetsPerRow = Math.ceil(Math.sqrt(widgetCount));
    const widgetsPerCol = Math.ceil(widgetCount / widgetsPerRow);
    const tileSize = {
      rows: this.gridOptions.maxRows / widgetsPerCol,
      cols: this.gridOptions.maxCols / widgetsPerRow
    };
    if (widgetCount === 3) {
      tileSize.rows = this.gridOptions.maxRows;
      tileSize.cols = this.gridOptions.maxCols / 3;
    }
    switch (this.gridOptions.gridType) {
      case GridType.Fit:
        break;
      case GridType.ScrollVertical:
        tileSize.rows = tileSize.cols;
        break;
      case GridType.ScrollHorizontal:
        tileSize.cols = tileSize.rows;
        break;
      case GridType.Fixed:
        break;
    }
    let x = 0;
    let y = 0;
    let index = 0;
    this.dashboardArray = this.dashboardArray.map(widget => {
      if (this.gridOptions.gridType !== GridType.ScrollHorizontal && this.gridOptions.gridType !== GridType.HorizontalFixed) {
        widget.x = x;
        widget.y = y;
        widget.rows = y % widgetsPerCol !== 0 ? Math.floor(tileSize.rows) : Math.ceil(tileSize.rows);
        widget.cols = index % widgetsPerRow !== 0 ? Math.floor(tileSize.cols) : Math.ceil(tileSize.cols);
        if (x + tileSize.cols < this.gridOptions.maxCols - 1) {
          x += index % widgetsPerRow !== 0 ? Math.floor(tileSize.cols) : Math.ceil(tileSize.cols);
          index++;
        } else if (x + tileSize.cols >= this.gridOptions.maxCols - 1) {
          x = 0;
          y += y % widgetsPerCol !== 0 ? Math.floor(tileSize.rows) : Math.ceil(tileSize.rows);
          index = 0;
        }
        return widget;
      } else {
        widget.x = x;
        widget.y = y;
        widget.rows = index % widgetsPerRow !== 0 ? Math.floor(tileSize.cols) : Math.ceil(tileSize.cols);
        widget.cols = y % widgetsPerCol !== 0 ? Math.floor(tileSize.rows) : Math.ceil(tileSize.rows);
        if (y + tileSize.rows < this.gridOptions.maxRows - 1) {
          y += index % widgetsPerCol !== 0 ? Math.floor(tileSize.rows) : Math.ceil(tileSize.rows);
          index++;
        } else if (y + tileSize.rows >= this.gridOptions.maxRows - 1) {
          y = 0;
          x += y % widgetsPerRow !== 0 ? Math.floor(tileSize.cols) : Math.ceil(tileSize.cols);
          index = 0;
        }
        return widget;
      }
    });
    this.cdr.detectChanges();
  }
  async removeItem(event: any, item: any) {
    event?.preventDefault();
    event?.stopPropagation();
    if (Array.isArray(item)) {
      const res = await this.dialog.open(DeleteDialogComponent, { width: '350px', data: {} }).afterClosed().toPromise();
      if (res) {
        item.forEach(widget => {
          if (widget.strongIndex === 'ResultWidgetComponent') {
            const lsIndexUser = UserConstValue.RESULT_STATE;
            localStorage.removeItem(`${lsIndexUser}-${widget.id}`);
          } else if (widget.strongIndex === 'ProtosearchWidgetComponent') {
            const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.USER_SETTINGS));
            if (ls !== null) {
              delete ls.protosearchSettings[widget.id];
              setStorage(UserConstValue.USER_SETTINGS, ls);
            }
          }
          this.dashboardArray = this.dashboardArray.filter(i => JSON.stringify(i) !== JSON.stringify(widget));
          this.dashboardArray.forEach((i: any) => {
            i.output = {
              changeSettings: this.onChangeWidget.bind(this)
            };
          });
        });
        this.save();
      }

    } else {
      this.dashboardArray = this.dashboardArray.filter(i => JSON.stringify(i) !== JSON.stringify(item));
      this.dashboardArray.forEach((i: any) => {
        i.output = {
          changeSettings: this.onChangeWidget.bind(this)
        };
      });
      this.save();
    }
  }

  onChangeWidget({ config, id }) {
    const widget = this.dashboardArray.find(i => i.id === id);
    if (widget) {
      widget.config = config;
    }
    // this.dashboardArray[this.dashboardArray.map(i => i.id).indexOf(id)].config = config;
    this.save();
  }

  async onDashboardAdd(tabGroup: string = null) {

    const data = await this.dialog.open(AddDialogComponent, { width: '600px', data: {} }).afterClosed().toPromise();
    const defaultColsRows = { maxCols: 300, maxRows: 300 };
    const { maxCols, maxRows, minRows, minCols, gridType } = this.gridOptions;
    const winHeight = window.innerHeight;
    const winWidth = window.innerWidth;
    const cellWidth = (winWidth - (6 * minCols)) / minCols;
    const cellHeight = Math.round((winHeight / Math.round(minRows)) - 6);
    if (!data) {
      return;
    }

    const { indexName, strongIndex, title } = data;
    const defaultWidg = {
      minWidth: 300,
      minHeight: 300
    };


    const minHeight = typeof data?.data?.minHeight !== 'undefined' ? data.data.minHeight : defaultWidg.minHeight;
    const minWidth = typeof data?.data?.minWidth !== 'undefined' ? data.data.minWidth : defaultWidg.minWidth;
    let widgSize;
    const fixedWidth = this.gridOptions.fixedColWidth;
    const fixedHeight = this.gridOptions.fixedRowHeight;
    switch (gridType) {
      case 'fit':
        widgSize = { wHeight: Math.round(minHeight / cellHeight), wWidth: Math.round(minWidth / cellWidth) };
        break;
      case 'scrollVertical':
        widgSize = { wHeight: Math.round(minHeight / cellWidth), wWidth: Math.round(minWidth / cellWidth) };
        break;
      case 'scrollHorizontal':
        widgSize = { wHeight: Math.round(minHeight / cellHeight), wWidth: Math.round(minWidth / cellHeight) };
        break;
      case 'verticalFixed':
        widgSize = { wHeight: Math.round(minHeight / fixedHeight), wWidth: Math.round(minWidth / cellWidth) };
        break;
      case 'horizontalFixed':
        widgSize = { wHeight: Math.round(minHeight / cellHeight), wWidth: Math.round(minWidth / fixedWidth) };
        break;
      case 'fixed':
        widgSize = { wHeight: Math.round(minHeight / fixedHeight), wWidth: Math.round(minWidth / fixedWidth) };
        break;
      default:
        widgSize = { wHeight: Math.round(minHeight / cellHeight), wWidth: Math.round(minWidth / cellWidth) };

    }
    const { wHeight, wWidth } = widgSize;
    // set the widget id
    const resultsArray = this.dashboardArray?.filter(f => f.strongIndex === strongIndex) || [];
    const match = resultsArray[resultsArray?.length - 1]?.id.match(/-(\d+)_|-(\d+)home/);
    const lastWidgetId = match === null || typeof match === 'undefined' ?
      '0' :
      match[1] !== null && typeof match[1] !== 'undefined' ?
        match[1] :
        match[2];
    const resultIdx = parseInt(lastWidgetId, 10) + 1;
    const wTitle = indexName + '-' + resultIdx;
    const widget: DashboardContentModel = {
      x: 0, y: 0, cols: wWidth || 1, rows: wHeight || 1,
      name: indexName,
      id: wTitle + '_' + Functions.newGuid(),
      minHeight: minHeight,
      config: data.data.data || null,
      minWidth: minWidth,
      title: indexName.toLowerCase() === 'result' ? wTitle : title,
      strongIndex,
      output: { changeSettings: this.onChangeWidget.bind(this) }
    };
    if (data.config) { widget.config = data.config; }
    if (tabGroup) { widget.tabGroup = tabGroup; }
    if (!this.gridOptions?.api?.getNextPossiblePosition(widget)) {
      this.gridOptions.gridType = GridType.ScrollVertical;
      this.dashboardCollection.data.config.gridType = GridType.ScrollVertical;
      this.changedOptions();
      const updatedWidget = this.gridOptions?.api?.getFirstPossiblePosition(widget);
      widget.x = updatedWidget.x;
      widget.y = updatedWidget.y;
    }
    this.dashboardArray = [...this.dashboardArray, widget];
    this.save();
    this.dashboardService.update();
    setTimeout(() => {
      if (!this.isIframe) {
        this.resizeExcess();
        this.checkWidgets();
      }
    }, 100);
  }

  onDownloadDashboardSettings() {
    Functions.saveToFile(JSON.stringify(this.dashboardCollection, null, 2), `${this.dashboardTitle}.json`);
  }

  async onShareQrLink() {
    const _d = this.dashboardCollection.data = this.dashboardCollection.data || {};
    const dialogref = this.dialog.open(ShareQrDialogComponent, {
      width: '650px', data: {
        shared: _d.shared,
        id: _d.id,
        qrElementType: this.qrElementType,
        qrCorrectionLevel: this.qrCorrectionLevel,
        qrValue: '',
      }
    });
    dialogref.componentInstance.params = {
      shareDashboard: (shared) => {
        this.dashboardCollection.data.shared = shared;
        this.onDashboardSave().toPromise();
        this.getData();
        this.dashboardService.update();

      }
    };
    const data = await dialogref.afterClosed().toPromise();
    await this.onDashboardSave().toPromise();
    this.getData();
    this.dashboardService.update();
  }
  // edit dashboard settings - get the data from here
  async onDashboardSettings() {
    let isTile = false;
    const _d = this.dashboardCollection.data = this.dashboardCollection.data || {};
    this.prevDash = Functions.cloneObject(this.gridOptions);
    this.prevWidgArray = Functions.cloneObject(this.dashboardArray);
    this.prevWidgArray?.forEach(f => {
      f.height = document.getElementById(f.id)?.clientHeight;
      f.width = document.getElementById(f.id)?.clientWidth;
    });
    _d.config = _d.config || { pushing: true };
    const bufferConfig = Functions.cloneObject(_d);
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '650px', data: {
        id: _d.id,
        name: this.dashboardTitle,
        type: _d.type,
        isTab: _d.isTab,
        param: _d.param || '',
        shared: !!_d.shared,
        columns: _d.config.columns || 33,
        maxrows: _d.config.maxrows || 33,
        pushing: !!_d.config.pushing,
        grafanaTimestamp: _d.config.grafanaTimestamp,
        grafanaProxy: _d.config.grafanaProxy,
        hasVariables: _d.config.hasVariables,
        ignoreMinSize: _d.config.ignoreMinSize || 'warning',
        gridType: _d.config.gridType || GridType.Fit,
      }
    });
    const widgetDeleteSub = dialogRef.componentInstance.onDeleteWidgets.subscribe(() => {
      this.deleteAllWidgets();
    });
    const widgetTileSub = dialogRef.componentInstance.onTile.subscribe(() => {
      isTile = true;
    });
    dialogRef.componentInstance.export(this.onDownloadDashboardSettings.bind(this));
    const data = await dialogRef.afterClosed().toPromise();
    if (_d.isTab && data) {
      this._sss.sessionStorage.subscribe(tabs => {

        const tabsUpd = tabs.searchTabs;
        tabs.searchTabs.find((f, i, a) => {
          if (f.id === data.id) {

            tabsUpd[i].name = data.name;
          }
        });
      });
    }
    const grid = !this.isIframe ? this.gridster.el : { clientHeight: 0, offsetWidth: 0 };

    const gridHeight = grid.clientHeight;

    const gridWidth = grid.offsetWidth;
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
      dd.config.grafanaProxy = data.grafanaProxy;
      dd.config.hasVariables = data.hasVariables;
      dd.config.ignoreMinSize = data.ignoreMinSize;
      dd.config.gridType = data.gridType;

      ((g, c) => {
        g.maxRows = g.minRows = c.maxrows || 33;
        g.maxCols = g.minCols = c.columns || 33;
        g.pushItems = !!c.pushing;
        g.disablePushOnDrag = !c.pushing;
        g.disablePushOnResize = !c.pushing;
        g.pushResizeItems = !!c.pushing;
        g.gridType = c.gridType;
        g.fixedColWidth = (gridWidth - (6 * c.columns)) / (c.columns);
        g.fixedRowHeight = gridHeight / c.maxrows;

      })(this.gridOptions, dd.config);

      this.changedOptions();

    })(this.dashboardCollection, _d);
    // prevDash = previous dashboard
    // gridOptions = current dashboard
    const wParams = { colParam: {}, rowParam: {} };
    const pD = this.prevDash;
    const gO = this.gridOptions;

    let prevColWidth = 0;
    let actColWidth = 0;
    let prevRowHeight = 0;
    let actRowHeight = 0;


    this.dashboardArray.forEach(f => {

      const prevWidget = this.prevWidgArray?.find(g => g.id === f.id);

      switch (gO.gridType) {

        case 'fit':
          f.cols = Math.round((f.cols * this.gridOptions.minCols) / this.prevDash.minCols);
          f.rows = Math.round((f.rows * this.gridOptions.minRows) / this.prevDash.minRows);
          break;

        case 'scrollVertical':
          prevColWidth = (gridHeight - ((6 * this.prevDash.minRows) - 6)) / this.prevDash.minRows;
          actColWidth = (gridWidth - ((6 * this.gridOptions.minCols) - 6)) / this.gridOptions.minCols;
          f.cols = Math.round((f.cols * this.gridOptions.minCols) / this.prevDash.minCols);
          f.rows = Math.round((f.rows * prevColWidth) / actColWidth);
          break;

        case 'scrollHorizontal':
          // get for previous width / height
          prevRowHeight = prevWidget.height / prevWidget.rows;
          prevColWidth = prevWidget.width / prevWidget.cols;

          prevRowHeight = Math.round((gridHeight - ((6 * this.prevDash.minRows) - 6)) / this.prevDash.minRows);
          actRowHeight = Math.round((gridHeight - ((6 * this.gridOptions.minRows) - 6)) / this.gridOptions.minRows);
          f.rows = Math.round((f.rows * this.gridOptions.minRows) / this.prevDash.minRows);

          // GET COL AMOUNT
          // const actualRowHeight = (gridHeight - ((6 * this.gridOptions.minRows) - 6)) / this.gridOptions.minRows;
          // const actualColAmount = Math.round(gridWidth / actualRowHeight);

          //  f.cols = Math.round((prevWidget.cols * actualColAmount) / this.prevDash.minCols)
          //  f.cols = Math.round((f.cols * prevRowHeight) / actRowHeight)

          //  f.minItemCols = f.cols;
          //  f.minItemRows = f.rows;
          //  f.x = Math.round((f.x * this.gridOptions.minCols) / this.prevDash.minCols) + 1 || 0;

          break;
        default:

          f.cols = Math.round((f.cols * this.gridOptions.minCols) / this.prevDash.minCols);
          // f.minItemCols = minCols

          f.rows = Math.round((f.rows * this.gridOptions.minCols) / this.prevDash.minCols);
        // f.minItemRows = minRows
      }
      f.x = Math.round((f.x * this.gridOptions.minCols) / this.prevDash.minCols) || 0;
      f.y = Math.round((f.y * this.gridOptions.minRows) / this.prevDash.minRows) || 0;

    });

    widgetDeleteSub.unsubscribe();
    widgetTileSub.unsubscribe();

    if (isTile) {
      this.tileWidgets();
    }
    await this.onDashboardSave().toPromise();
    if (this.isIframe && bufferConfig.param !== _d.param) {
      this.buildUrl();
    }
    this.getData();
    this.dashboardService.update();

  }
  async onDashboardDelete() {
    const res = await this.dialog.open(DeleteDialogComponent, { width: '350px', data: {} }).afterClosed().toPromise();

    if (!res) {
      return;
    }

    const dashboardId = this.dashboardService.getCurrentDashBoardId();
    const res2 = await this.dashboardService.deleteDashboardStore(dashboardId);

    if (!res2) {
      return;
    }
    this.router.navigateByUrl('/');
    this.dashboardService.update();
  }

  onDashboardSave() {
    if (!this.dashboardCollection?.data) {
      return new Observable<any>(observer => observer.complete());
    }
    this.dashboardCollection.data.widgets = this.dashboardArray;
    this.dashboardCollection.data.isLocked = this.gridLocked;
    const _hash = Functions.md5(JSON.stringify(this.dashboardCollection));

    if (this.postSaveHash === _hash) {
      return new Observable();
    }

    this.postSaveHash = _hash;
    this.dashboardService.setWidgetListCurrentDashboard(this.dashboardCollection.data.widgets);

    return this.dashboardService.updateDashboard(this.dashboardCollection.data);
  }

  ngOnDestroy() {
    clearInterval(this._interval);
    this.subscription?.unsubscribe();
    this._route_paramsSubscription?.unsubscribe();
  }

  private getWidgetItemClass(item: DashboardContentModel): IWidgetMetaData {
    let wItem: IWidgetMetaData[];
    if (item.strongIndex) {
      wItem = WidgetArray.filter(i => i.strongIndex === item.strongIndex);
    } else {
      wItem = WidgetArray.filter(i => i.indexName === item.name);
    }
    return wItem[0];
  }

  getComponentWidget(item: any) {
    const w = this.getWidgetItemClass(item);
    return w ? w.componentClass : null;
  }

  public hasSettings(item: any): boolean {
    const w = this.getWidgetItemClass(item);
    return w ? w.settingWindow || false : false;
  }

  identify(index, item) {
    return item.id;
  }
  setActive(item: DashboardContentModel, collectionItem: DashboardContentModel[], type = null) {
    collectionItem.forEach(i => {
      if (!type || (type && type === i.strongIndex)) {
        i.activeTab = false;
      }
    });
    item.activeTab = true;
    this.save();
    this.cdr.detectChanges();
  }
  getActive(collectionItem) {
    return collectionItem.find(i => i.activeTab) || collectionItem[0];
  }
  dashboardDrop(event, item: any = null) {

  }
  public drop(event, isNewGroupName = false) {
    const getID = el => el?.element?.nativeElement?.id;
    const { item, container } = event;
    const widget = this.dashboardArray.find(w => w.id === getID(item));
    if (widget) {
      widget.tabGroup = isNewGroupName ?
        `tabIndex-${Math.ceil(Math.random() * 999999)}` :
        getID(container);
      this.dashboardArray = [...this.dashboardArray]; // refresh dashboard
      this.save();
      this.cdr.detectChanges();
    }
  }
  dragStartHandler(ev: DragEvent, item: any = null): void {
    if (ev.dataTransfer) {
      ev.dataTransfer.setData('text/plain', 'Drag Me Button');
      ev.dataTransfer.dropEffect = 'copy';
    }
    this.cdr.detectChanges();
  }
  getLayerIndex(item: any) {
    item.layerIndex = 2;
    return item;
  }
  updateRowRatio() {
    if (this.isIframe) {
      return;
    }
    if (typeof this.gridster === 'undefined') {
      setTimeout(() => {
        this.updateRowRatio();
      }, 100);
      return;
    }
    if (this.gridOptions.gridType === GridType.ScrollVertical) {
      const columnWidth = this.gridster.el.clientWidth / this.gridOptions.maxCols;
      const rowAmount = Math.floor(this.gridster.el.clientHeight / columnWidth);
      const rowHeight = Math.ceil(this.gridster.el.clientHeight / rowAmount);
      this.gridOptions.rowHeightRatio = rowHeight / columnWidth;
    } else if (this.gridOptions.gridType === GridType.ScrollHorizontal) {
      const rowHeight = this.gridster.el.clientHeight / this.gridOptions.maxRows;
      const columnAmount = Math.floor(this.gridster.el.clientWidth / rowHeight);
      const columnWidth = Math.ceil(this.gridster.el.clientWidth / columnAmount);
      this.gridOptions.rowHeightRatio = columnWidth / rowHeight;
    } else {
      this.gridOptions.rowHeightRatio = 1;
    }
    try {
      this.gridOptions?.api?.optionsChanged();
    } catch (err) { }
  }
  // To work on Grafana "Variables" feature you have to have setup with same origin for backend and UI 
  // or set ---disable-site-isolation-trials flag in chrome, DON'T FORGET TO REMOVE FLAG AFTERWARDS, IT IS UNSAFE
  onLoadIframe() {
    if (this.iframeUrl !== '') {
        this.isIframeLoaded = true;
        if (this.isSameOrigin && this.dashboardCollection.data.config.hasVariables) {
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
}
