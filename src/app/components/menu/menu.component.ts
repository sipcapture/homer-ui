import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService, DashboardService, DashboardEventData } from '@app/services';
import { User, WidgetModel, DashboardModel } from '@app/models';
import { Router, ActivationEnd, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddDashboardDialogComponent } from '../dashboard/add-dashboard-dialog/add-dashboard-dialog.component';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';
import { DateTimeRangeService } from '../../services/data-time-range.service';
import { SessionStorageService, UserSettings } from '../../services/session-storage.service';
import { Subscription } from 'rxjs';
import { environment } from '@environments/environment';

export interface DashboardData {
    cssclass: string;
    href: string;
    id: string;
    name: string;
    param: string;
    shared: number;
    type: number;
    weight: number;
}

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
    sessionStorageSubscription: Subscription;
    panelList: Array<any>;
    timeRangeName: string;
    panelName: string;
    refresherName: string;
    currentDashboardId: string;
    refresherList = [
        { value: 0, name: 'off', title: 'No Autorefresh' },
        { value: 2000, name: '2 sec', title: 'Refresh @ 2 sec' },
        { value: 5000, name: '5 sec', title: 'Refresh @ 5 sec' },
        { value: 10000, name: '10 sec', title: 'Refresh @ 10 sec' },
        { value: 30000, name: '30 sec', title: 'Refresh @ 30 sec' },
        { value: 60000, name: '1 min', title: 'Refresh @ 1 min' },
        { value: 300000, name: '5 min', title: 'Refresh @ 5 min' },
        { value: 600000, name: '10 min', title: 'Refresh @ 10 min' },
        { value: 1800000, name: '30 min', title: 'Refresh @ 30 min' },
        { value: 3600000, name: '60 min', title: 'Refresh @ 60 min' }
    ];
    loadingAnim: string;
    animal: string;
    name: string;
    dashboardId: string;
    searchText: string;

    alwaysShowCalendars: boolean;
    isRangeClicked = false;
    public get ranges() {
        return this._dtrs.getRangeByLabel(null, true);
    }

    selectedDateTimeRangeTitle: string;
    selectedDateTimeRange: any;
    currentPath: string;

    // Components variables
    protected toggle: boolean;
    protected modal: boolean;
    protected widgetCollection: WidgetModel[];
    protected dashboardCollection: DashboardModel[];

    currentUser: User;
    dashboards: DashboardData[];

    constructor(
        private _ds: DashboardService,
        private _dtrs: DateTimeRangeService,
        private router: Router,
        public dialog: MatDialog,
        private authenticationService: AuthenticationService,
        private _sss: SessionStorageService
    ) {
        if (environment.environment !== '') {
            document.title += ' ' + environment.environment;
        }
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        router.events.pipe(
            filter(e => e instanceof ActivationEnd)
        ).subscribe((evt: ActivationEnd) => {
            this.currentPath = evt.snapshot.routeConfig.path;
        });
    }

    // On component init we store Widget Marketplace in a WidgetModel array
    ngOnInit(): void {
        this.sessionStorageSubscription = this._sss.sessionStorage.subscribe((data: UserSettings) => {
            if (data.updateType !== 'proto-search') {
                if (data && data.dateTimeRange.dates) {
                    this.selectedDateTimeRangeTitle = data.dateTimeRange.title;
                    this.selectedDateTimeRange = (data.dateTimeRange.title)
                        || data.dateTimeRange.dates.map(i => moment(i));
                }
            }
        });

        if (!this.selectedDateTimeRangeTitle) {
            this.selectedDateTimeRangeTitle = 'Today';
            this.selectedDateTimeRange = this._dtrs.getRangeByLabel(this.selectedDateTimeRangeTitle);
        }
        this._dtrs.castRangeUpdateTimeout.subscribe(dtr => {
            this.loadingAnim = 'loading-anim';
            setTimeout(() => {
                this.loadingAnim = '';
            }, 1500);
        });
        this._ds.dashboardEvent.subscribe((data: DashboardEventData) => {
            this.updateDashboardList();
        });
        this.updateDashboardList();
    }
    updateDashboardList() {
        this._ds.getDashboardInfo().toPromise().then((resData: any) => {
            if (resData) {
                this.dashboards = resData.data.sort(function (a, b) {
                    a = (a.name + '').charCodeAt(0);
                    b = (b.name + '').charCodeAt(0);
                    if (a > b) {
                        return 1;
                    }
                    if (b > a) {
                        return -1;
                    }
                    return 0;
                });
                this.panelList = this.dashboards.map(item => item.name);
                try {
                    this.panelName = this.dashboards.find(item => item.href === this._ds.getCurrentDashBoardId()).name;
                    this.currentDashboardId = this._ds.getCurrentDashBoardId();
                } catch (e) { }
            }
        });
    }
    logout() {
        this.authenticationService.logout();
        this.router.navigate([{ outlets: { primary: null, system: 'login'}}]);
    }

    dashboardGo(id: string) {
        this.router.navigate(['dashboard/' + id.toLowerCase()]);
    }

    doSearchResult() {
        this.router.navigate(['search/result']);
    }
    backLastToDashboard () {
        // this.panelName = this._ds.getCurrentDashBoardId();
        // this.dashboardGo('/' + this._ds.getCurrentDashBoardId());
        this.panelName = 'home';
        this.dashboardGo('/home');
    }
    onAddDashboard () {
        const dialogRef = this.dialog.open(AddDashboardDialogComponent, { width: '650px',
            data: {
                nameNewPanel: '',
                type: 1,
                param: ''
            }
        });
        const dialogRefSubscription = dialogRef.afterClosed().subscribe( (data) => {
            if (data) {
                let id = '_' + new Date().getTime();
                if (data.type === 3) {
                    id = 'home';
                } else
                if (data.type === 4) {
                    id = 'search';
                }

                let dashboardData = {
                    id: id,
                    alias: id,
                    name: data.nameNewPanel,
                    selectedItem: '',
                    type: data.type,
                    param: data.param || data.nameNewPanel.toLowerCase(),
                    shared: 0,
                    weight: 10,
                    widgets: []
                };
                if (data.dashboard) {
                    dashboardData = data.dashboard;
                    dashboardData.id = dashboardData.alias = id;
                    dashboardData.name = data.nameNewPanel;
                    dashboardData.param = data.param || data.nameNewPanel.toLowerCase();
                }
                const dashboardStoreSubscription = this._ds.postDashboardStore(dashboardData.id, dashboardData).subscribe(res => {
                    dashboardStoreSubscription.unsubscribe();
                    this.updateDashboardList();
                    if (res && res.status === 'ok') {
                        this.router.navigate([`/dashboard/${dashboardData.id}`]);
                    }
                });
            }
            dialogRefSubscription.unsubscribe();
        });
    }
    onRangeClicked(event: any) {
        this.isRangeClicked = true;
        this.selectedDateTimeRangeTitle = event.label;
    }
    onDatesUpdated (event: any) {
        this.selectedDateTimeRange = [event.startDate, event.endDate];
        if (this.isRangeClicked) {
            this.isRangeClicked = false;
        } else {
            this.selectedDateTimeRangeTitle = this.selectedDateTimeRange.map(i => i.format('DD/MM/YYYY HH:mm:ss')).join(' - ');
        }

        this._dtrs.updateDataRange({
            title: this.selectedDateTimeRangeTitle,
            dates: this.selectedDateTimeRange
        });
    }
    onRefrasher (delay: number) {
        this._dtrs.setDelay(delay);
    }

    onPreference() {
        this.router.navigate(['preference/users']);
    }
    refresh() {
        this._dtrs.refrash();
    }
    ngOnDestroy () {
        this.sessionStorageSubscription.unsubscribe();
    }
}

