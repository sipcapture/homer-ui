import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ElementRef,
    ViewChild,
} from '@angular/core';
import {
    AuthenticationService,
    DashboardService,
    DashboardEventData,
    PreferenceUserSettingsService,
    SearchService,
    PreferenceAdvancedService,
    AlertService,
    SessionStorageService,
    UserSettings,
    DateTimeRangeService,
    UserSecurityService,
    PreferenceUserService
} from '@app/services';
import {
    User,
    WidgetModel,
    DashboardModel,
    ConstValue,
    UserProfile,
} from '@app/models';
import { MatDialog } from '@angular/material/dialog';
import { AddDashboardDialogComponent } from '../dashboard/';
import { Router, ActivationEnd } from '@angular/router';
import * as moment from 'moment';
import { lastValueFrom, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as widgets from '../widgets';
import { Functions, setStorage } from '@app/helpers/functions';
import { TranslateService } from '@ngx-translate/core';
import { TimeFormattingService } from '@app/services/time-formatting.service';
export interface DashboardData {
    cssclass: string;
    href: string;
    id: string;
    name: string;
    param: string;
    shared: boolean;
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
        { value: 3600000, name: '60 min', title: 'Refresh @ 60 min' },
    ];
    isDashboardFavorite: boolean;
    isRefreshClicked = true;
    userSetting: UserSettings;
    currentUserData;
    loadingAnim: string;
    animal: string;
    name: string;
    dashboardId: string;
    searchText: string;
    favoriteDashboards = [];
    favoriteDashboardsList = [];
    searchTabsList = [];
    alwaysShowCalendars: boolean;
    notify = false;
    favUserDetail = {
        user: '',
        favorites: [],
    };
    isRangeClicked = false;
    public get ranges() {
        return this._dtrs.getRangeByLabel(null, true);
    }

    selectedDateTimeRangeTitle: string;
    selectedDateTimeRange: any;
    selectedDateTimeRangeZone: string;
    currentPath: string;

    // Components variables
    protected toggle: boolean;
    protected modal: boolean;
    protected widgetCollection: WidgetModel[];
    protected dashboardCollection: DashboardModel[];

    isDashboardAdd = true;
    objectValues = Object.values;
    currentUser: User;
    dashboards: DashboardData[];
    sharedDashboards: DashboardData[];
    searchTabsListFromLocal = [];
    dashboardList: any;
    dateFormat: string;
    firstInit = true;
    userProfile: UserProfile;
    @ViewChild('favList', { static: true }) favList: ElementRef;
    @ViewChild('tabList', { static: true }) tabList: ElementRef;
    constructor(
        private dashboardService: DashboardService,
        private _dtrs: DateTimeRangeService,
        private router: Router,
        public dialog: MatDialog,
        private authenticationService: AuthenticationService,
        private _sss: SessionStorageService,
        private cdr: ChangeDetectorRef,
        private _puss: PreferenceUserSettingsService,
        private _pus: PreferenceUserService,
        private userSecurityService: UserSecurityService,
        private searchService: SearchService,
        private _pas: PreferenceAdvancedService,
        private alertService: AlertService,
        private translateService: TranslateService,
        private _tfs: TimeFormattingService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (environment.environment !== '') {
            document.title += ' ' + environment.environment;
        }
        this.authenticationService.currentUser.subscribe(
            (x) => (this.currentUser = x)
        );
        router.events
            .pipe(filter((e) => e instanceof ActivationEnd))
            .subscribe((evt: ActivationEnd) => {
                this.currentPath = evt.snapshot.routeConfig.path;
                if (!this.firstInit) {
                    this.updateTabList();
                }
            });
    }

    async ngOnInit() {
        const wArr = widgets; /* hack for init all widget on prodaction mode - DON'T REMOVE IT!!!! */
        await this.getFormat();
        await this.getProfile();
        this.isDashboardAdd = await this.userSecurityService.isDashboardAdd();
        this.updateTabList();

        if (!this.selectedDateTimeRangeTitle) {
            this.selectedDateTimeRangeTitle = 'Today';
            this.selectedDateTimeRange = this._dtrs.getRangeByLabel(
                this.selectedDateTimeRangeTitle
            );
        }
        this.searchService.event.subscribe(() => {
            this.notify = false;
            this.cdr.detectChanges();
        });
        this._dtrs.castRangeUpdateTimeout.subscribe(() => {
            this.renewNotify();
            this.cdr.detectChanges();
        });
        this.dashboardService.dashboardEvent.subscribe((data: DashboardEventData) => {
            this.notify = false;
            this.updateDashboardList();
        });
        this.updateDashboardList();
        this.cdr.detectChanges();
        this.firstInit = false;
    }
    private updateTabList() {
        const ranges = Object.keys(this.ranges);
        this.sessionStorageSubscription = this._sss.sessionStorage.subscribe(
            (data: UserSettings) => {
                if (
                    data.updateType !== 'proto-search' &&
                    data &&
                    data.dateTimeRange.dates
                ) {
                    this.selectedDateTimeRangeTitle = ranges.some(i => i === data.dateTimeRange.title) ?
                        data.dateTimeRange.title : data.dateTimeRange.dates.map(i =>
                            moment(i).format(this.dateFormat)).join(' - ');
                    this.selectedDateTimeRange =
                        data.dateTimeRange.title ||
                        data.dateTimeRange.dates.map((i) => moment(i));
                    this.cdr.detectChanges();
                }
                if (data.favorites) {
                    this.favoriteDashboardsList = data.favorites;
                }
                if (data.searchTabs && data.searchTabs.length > 0) {
                    const currentUser = this.authenticationService.getUserName() || '';
                    data.searchTabs.forEach(tab => {
                        if (!tab.hasOwnProperty('owner')) {
                            this.deleteSearchTab(tab);
                        }
                    });
                    this.searchTabsList = data.searchTabs.filter(f =>
                        f.owner.username === currentUser);
                    this.cdr.detectChanges();
                }
            }
        );
    }
    private renewNotify() {
        if (this.isRefreshClicked) {
            this.notify = false;
        } else {
            this.notify = this.dashboardService.dbs.currentWidgetList
                .filter(({ name }) => name.toLowerCase() === 'result')
                .map(({ id }) => this.dashboardService.loadWidgetParam(id, 'isAutoRefrasher') === true)
                .reduce((a, b) => a || b, false);
        }
        this.isRefreshClicked = false;
    }
    private checkAnimationRefrash() {
        this.loadingAnim = 'loading-anim';
        setTimeout(() => {
            this.isRefreshClicked = false;
            this.loadingAnim = '';
            this.cdr.detectChanges();
        }, 1500);
        this._sss.updateDataFromLocalStorage();
        this.cdr.detectChanges();
    }
    async updateDashboardList() {
        const resData: any = await this.dashboardService.getDashboardInfo(0).toPromise();
        if (resData?.data) {
            const currentUser = this.authenticationService.getUserName();
            this.dashboards = resData.data.sort((...aa: any[]) => {
                const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
                return a < b ? -1 : a > b ? 1 : 0;
            }).filter(item => item.shared === false || item.owner === currentUser);
            this.sharedDashboards = resData.data.sort((...aa: any[]) => {
                const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
                return a < b ? -1 : a > b ? 1 : 0;
            }).filter(item => item.shared === true && item.owner !== currentUser);
            try {
                this.currentDashboardId = this.dashboardService.getCurrentDashBoardId();
                this.panelName = this.dashboards.find(
                    ({ href }) => href === this.currentDashboardId
                ).name;

            } catch (e) { }
        }
        this.cdr.detectChanges();
    }

    onScroll({ deltaY }, type) {
        const list = type === 'favList' ? this.favList : this.tabList;
        if (typeof deltaY !== 'undefined') {
            list.nativeElement.scrollLeft += deltaY;
            return;
        }
    }
    logout() {
        this.userSecurityService.removeUserSettings();
        this.authenticationService.logout();
        this.router.navigate([{ outlets: { primary: null, system: 'login' } }]);
    }

    dashboardGo(id: string) {
        this.router.navigate(['dashboard/' + id.toLowerCase()]);
    }
    tabGo(srcObj) {
        this.router.navigate(['dashboard/' + srcObj.link]);
        this.dashboardService.setQueryToWidgetResult(srcObj.id, srcObj.query);
        this.cdr.detectChanges();
    }

    doSearchResult() {
        this.router.navigate(['search/result']);
    }

    doSearchBigscreen(fav) {
        this.dashboardGo(fav['href']);
        setTimeout(() => {
            this.doSearchResult();
        }, 200);
    }
    async onTabRemove(id) {
        const data = this._puss.delete(id).toPromise();
        if (data) {
            this.translateService.get('notifications.success.tabRemoved').subscribe(res => {
                this.alertService.success(res);
            })
        }
    }
    backLastToDashboard() {
        this.router.navigateByUrl('/');
    }
    // add the search tab data here!
    async onAddDashboard() {
        const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
            width: '650px',
            data: {
                nameNewPanel: '',
                type: 1,
                param: '',
            },
        });
        const data = await dialogRef.afterClosed().toPromise();
        if (data) {
            const id = data.type === 4 ? 'search' : '_' + new Date().getTime();
            let dashboardData = {
                id: id,
                alias: id,
                name: data.nameNewPanel,
                selectedItem: '',
                type: data.type,
                param: data.param || data.nameNewPanel.toLowerCase(),
                shared: false,
                weight: 10,
                widgets: [],
                config: {
                    ignoreMinSize: 'warning',
                    maxrows: 6,
                    columns: 8,
                    grafanaProxy: data.type === 7 ? true : false,
                    grafanaTimestamp: data.type === 7 ? true : false
                },
            };
            if (data.dashboard) {
                dashboardData = data.dashboard;
                dashboardData.id = dashboardData.alias = id;
                dashboardData.name = data.nameNewPanel;
                dashboardData.param =
                    data.param || data.nameNewPanel.toLowerCase();
            }
            const res: any = await this.dashboardService
                .postDashboardStore(dashboardData.id, dashboardData)
                .toPromise();

            this.updateDashboardList();
            if (res && res.status === 'ok') {
                this.router.navigate([`/dashboard/${dashboardData.id}`]);
            }
            this.cdr.detectChanges();
        }
    }

    addDashboardFavorite(dashboardItem) {
        if (
            this.favoriteDashboardsList.some((f) => f.id === dashboardItem.id)
        ) {
            this.favoriteDashboardsList = this.favoriteDashboardsList.filter(
                (f) => f.id !== dashboardItem.id
            );
        } else {
            this.favoriteDashboardsList.push(dashboardItem);
        }
        this.favoriteDashboardsList = Array.from(
            this.favoriteDashboardsList
        ).sort((a: any, b: any) => {
            const aname = a.name;
            const bname = b.name;
            return aname.localeCompare(bname, 'en', { sensitivity: 'base' });
        });

        this._sss.saveFavoritesConfig(this.favoriteDashboardsList);
        this.cdr.detectChanges();
    }

    async deleteSearchTab(searchTab) {
        const sourceLink = searchTab.source_link;
        const currentLocation = this.dashboardService.getCurrentDashBoardId();
        const tabLocation = searchTab.link;

        this.searchTabsList = this.searchTabsList.filter(
            (f) => f.id !== searchTab.id
        );

        this._sss.saveSearchTabsConfig(this.searchTabsList);

        await this.onTabRemove(searchTab.id);

        const res: any = await this.dashboardService.deleteDashboardStore(searchTab.id);

        if (res) {
            this.dashboardService.update();
            this.updateDashboardList();
            if (sourceLink !== currentLocation && currentLocation === tabLocation) {
                this.router.navigateByUrl(`/dashboard/${sourceLink}`);
            }
            this.cdr.detectChanges();
        }
    }

    dropSearchTab(event: CdkDragDrop<string[]>) {
        moveItemInArray(
            this.searchTabsList,
            event.previousIndex,
            event.currentIndex
        );
        this._sss.saveSearchTabsConfig(this.searchTabsList);
        this.cdr.detectChanges();
    }

    dropFav(event: CdkDragDrop<string[]>) {
        moveItemInArray(
            this.favoriteDashboardsList,
            event.previousIndex,
            event.currentIndex
        );
        this._sss.saveFavoritesConfig(this.favoriteDashboardsList);
        this.cdr.detectChanges();
    }
    hasFav(item, fav) {
        return fav.some((f) => f.id === item.id);
    }
    onRangeClicked(event: any) {
        this.isRangeClicked = true;
        this.selectedDateTimeRangeTitle = event.label;
    }
    onDatesUpdated(event: any) {
        this.selectedDateTimeRange = [event.startDate, event.endDate];
        this.selectedDateTimeRangeZone = event.timezone;
        if (this.isRangeClicked) {
            this.isRangeClicked = false;
        } else {
            this.selectedDateTimeRangeTitle = this.selectedDateTimeRange
                .map((i) => i.format(this.dateFormat)).join(' - ');
        }
        this._dtrs.updateDataRange({
            title: this.selectedDateTimeRangeTitle,
            timezone: this.selectedDateTimeRangeZone,
            dates: this.selectedDateTimeRange
        });
    }
    async getFormat() {
        this.dateFormat = await this._tfs.getFormat().then(res => res.dateTime);
    }
    async getProfile() {
        const { data } = await lastValueFrom(this._pus.getCurrentUser())
        this.userProfile = data;
    }
    onRefrasher(delay: number) {
        this._dtrs.setDelay(delay);
    }

    onPreference(page: string = "users") {
        this.router.navigate([`preference/${page}`]);
    }

    refresh() {
        this.isRefreshClicked = true;
        this.dashboardService.update(false, true); // true param is important refresh for all
        this.checkAnimationRefrash();
    }
    ngOnDestroy() {
        if (this.sessionStorageSubscription) {
            this.sessionStorageSubscription.unsubscribe();
        }
    }
}
