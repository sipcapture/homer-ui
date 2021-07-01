import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthenticationService, DashboardService, DashboardEventData } from '@app/services';
import { User, WidgetModel, DashboardModel } from '@app/models';
import { Router, ActivationEnd, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddDashboardDialogComponent } from '../dashboard/add-dashboard-dialog/add-dashboard-dialog.component';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';
import { DateTimeRangeService } from '../../services/data-time-range.service';
import { SessionStorageService, UserSettings } from '../../services/session-storage.service';
import { PreferenceAdvancedService } from '@app/services';
import { Subscription } from 'rxjs';
import { environment } from '@environments/environment';
import { curveNatural } from 'd3';
import { UserSecurityService } from '@app/services/user-security.service';

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
    styleUrls: ['./menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
    selectedDateTimeRangeTitleValue: string;
    selectedDateTimeRange: any;
    selectedDateTimeRangeZone: string;
    currentPath: string;

    startDate: moment.Moment = null;
    endDate: moment.Moment = null;
    timepickerTimezone: string = null;
    grafana: any;
    // Components variables
    protected toggle: boolean;
    protected modal: boolean;
    protected widgetCollection: WidgetModel[];
    protected dashboardCollection: DashboardModel[];

    isDashboardAdd = true;
    currentUser: User;
    dashboards: DashboardData[];
    sharedDashboards: DashboardData[];

    constructor(
        private _ds: DashboardService,
        private _dtrs: DateTimeRangeService,
        private router: Router,
        public dialog: MatDialog,
        private authenticationService: AuthenticationService,
        private _sss: SessionStorageService,
        private _pas: PreferenceAdvancedService,
        private userSecurityService: UserSecurityService,
        private changeDetectorRefs: ChangeDetectorRef
    ) {
        this.startDate = null;
        this.endDate = null;
        this.selectedDateTimeRangeZone = null;
        if (environment.environment !== '') {
            document.title += ' ' + environment.environment;
        }
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        this._pas.getAll().subscribe(advancedObj => [this.grafana] = advancedObj.data.filter(advanced =>
            advanced.category === 'search' && advanced.param === 'grafana'));
        router.events.pipe(
            filter(e => e instanceof ActivationEnd)
        ).subscribe((evt: ActivationEnd) => {
            this.currentPath = evt.snapshot.routeConfig.path;
        });
    }

    // On component init we store Widget Marketplace in a WidgetModel array
    async ngOnInit() {

        this.isDashboardAdd = await this.userSecurityService.isDashboardAdd();
        this.sessionStorageSubscription = this._sss.sessionStorage.subscribe((data: UserSettings) => {
            if (data.updateType !== 'proto-search') {
                if (data && data.dateTimeRange.dates) {
                    this.selectedDateTimeRangeTitle = data.dateTimeRange.title;
                    this.selectedDateTimeRangeTitleValue  = data.dateTimeRange.title;

                    this.selectedDateTimeRange = (data.dateTimeRange.title)
                        || data.dateTimeRange.dates.map(i => moment(i));
                }
            }
        });

        if (!this.selectedDateTimeRangeTitle) {
            this.selectedDateTimeRangeTitle = 'Today';
            this.selectedDateTimeRangeTitleValue  = 'Today';
            this.selectedDateTimeRange = this._dtrs.getRangeByLabel(this.selectedDateTimeRangeTitle);
        }

        if (!this.selectedDateTimeRangeZone) {
            this.selectedDateTimeRangeZone = this._dtrs.getTimezoneForQuery();
        }


        this.timepickerTimezone = this._dtrs.getTimezoneForQuery();
        moment.tz.setDefault(this.timepickerTimezone);

        if (!this.startDate) {
            const dateFor: any = this._dtrs.getDatesForQuery(true);
            this.startDate = moment.unix(dateFor.from / 1000);
            this.endDate = moment.unix(dateFor.to / 1000);
        }

        this._dtrs.castRangeUpdateTimeout.subscribe(dtr => {
            this.loadingAnim = 'loading-anim';
            this.changeDetectorRefs.detectChanges();
            setTimeout(() => {
                this.loadingAnim = '';

                this.changeDetectorRefs.detectChanges();
            }, 1500);
        });
        this._ds.dashboardEvent.subscribe((data: DashboardEventData) => {
            this.updateDashboardList();
        });
        this.updateDashboardList();
        this.changeDetectorRefs.detectChanges();
    }
    updateDashboardList() {
        this._ds.getDashboardInfo().toPromise().then((resData: any) => {
            if (resData?.data) {
                const currentUser = this.authenticationService.getUserName();
                this.dashboards = resData.data.sort((...aa: any[]) => {
                    const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
                    return a < b ? -1 : a > b ? 1 : 0;
                }).filter(item =>
                    item.shared === 0 || item.shared === false || item.owner === currentUser);
                this.sharedDashboards = resData.data.sort((...aa: any[]) => {
                    const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
                    return a < b ? -1 : a > b ? 1 : 0;
                }).filter(item => (item.shared === 1 || item.shared === true) && item.owner !== currentUser);
                this.panelList = this.dashboards.map(item => item.name);
                try {
                    this.panelName = this.dashboards.find(item => item.href === this._ds.getCurrentDashBoardId()).name;
                    this.currentDashboardId = this._ds.getCurrentDashBoardId();
                } catch (e) { }
                this.changeDetectorRefs.detectChanges();
            }
        });
    }
    logout() {
        this.userSecurityService.removeUserSettings();
        this.authenticationService.logout();
        this.router.navigate([{ outlets: { primary: null, system: 'login' } }]);
        this.changeDetectorRefs.detectChanges();
    }

    dashboardGo(id: string) {
        this.router.navigate(['dashboard/' + id.toLowerCase()]);
        this.changeDetectorRefs.detectChanges();
    }

    doSearchResult() {
        this.router.navigate(['search/result']);
        this.changeDetectorRefs.detectChanges();
    }
    backLastToDashboard() {
        // this.panelName = this._ds.getCurrentDashBoardId();
        // this.dashboardGo('/' + this._ds.getCurrentDashBoardId());
        this.panelName = 'home';
        this.dashboardGo('/home');
        this.changeDetectorRefs.detectChanges();
    }
    onAddDashboard() {
        const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
            width: '650px',
            data: {
                nameNewPanel: '',
                type: 1,
                param: ''
            }
        });
        const dialogRefSubscription = dialogRef.afterClosed().subscribe((data) => {
            if (data) {
                let id = '_' + new Date().getTime();
                if (data.type === 3) {
                    id = 'home';
                } else if (data.type === 4) {
                    id = 'search';
                }
                if (data.type === 2 && data.param === '') {
                    data.param = this.grafana.data.host;
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
                    widgets: [],
                    config: {
                        ignoreMinSize: 'warning',
                        maxrows: 5,
                        columns: 5,
                        grafanaTimestamp: true
                    }
                };
                if (data.dashboard) {
                    dashboardData = data.dashboard;
                    dashboardData.id = dashboardData.alias = id;
                    dashboardData.name = data.nameNewPanel;
                    dashboardData.param = data.param || data.nameNewPanel.toLowerCase();
                }
                this._ds.postDashboardStore(dashboardData.id, dashboardData).toPromise().then(res => {
                    this.updateDashboardList();
                    if (res && res.status === 'ok') {
                        this.router.navigate([`/dashboard/${dashboardData.id}`]);
                    }
                });
                this.changeDetectorRefs.detectChanges();
            }
            dialogRefSubscription.unsubscribe();
        });
    }
    onRangeClicked(event: any) {
        this.isRangeClicked = true;
        this.selectedDateTimeRangeTitle = event.label;
        this.changeDetectorRefs.detectChanges();
    }
    onDatesUpdated(event: any) {

        this.selectedDateTimeRange = [event.startDate, event.endDate];
        this.selectedDateTimeRangeZone = event.timezone;
        if (this.isRangeClicked) {
            this.isRangeClicked = false;
        } else {
            this.selectedDateTimeRangeTitle = this.selectedDateTimeRange.map(i => i.format('DD/MM/YYYY HH:mm:ss')).join(' - ');
        }

        this._dtrs.updateDataRange(
            {
            title: this.selectedDateTimeRangeTitle,
            timezone: this.selectedDateTimeRangeZone,
            dates: this.selectedDateTimeRange
        });

        this.changeDetectorRefs.detectChanges();
    }
    onRefrasher(delay: number) {
        this._dtrs.setDelay(delay);
        this.changeDetectorRefs.detectChanges();
    }

    onPreference() {
        this.router.navigate(['preference/users']);
        this.changeDetectorRefs.detectChanges();
    }
    refresh() {
        this._dtrs.refrash();
        this.changeDetectorRefs.detectChanges();
    }
    ngOnDestroy() {
        this.sessionStorageSubscription.unsubscribe();
    }
}
