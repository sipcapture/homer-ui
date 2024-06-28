
import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    Input,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
    StatisticService
} from '@app/services';
import {
    DialogDBSelectorComponent,
    DialogUsersComponent,
} from '@app/components/preference/dialogs';
import {
    StatsDb,
} from '@app/models';

import { AlertService, AuthenticationService } from '@app/services';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-page-system-overview',
    templateUrl: './page-system-overview.component.html',
    styleUrls: ['./page-system-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageSystemOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
    isLoading = false;
    isAdmin = false;
    isConfigTab = false;
    isErrorResponse = false;
    dataSource = new MatTableDataSource([{}]);
    configSource = new MatTableDataSource([{}]);
    @Input() page: string;
    @Input() pageID: string;
    @ViewChild('dataSorter', { static: false }) sorter: MatSort;
    @ViewChild('configSorter', { static: false }) configSorter: MatSort;
    @ViewChild('dataPaginator', { static: true }) paginator: MatPaginator;
    @ViewChild('configPaginator', { static: true }) configPaginator: MatPaginator;
    columns = [];
    configColumns = [];
    specialColumns = [];
    isAccess: any;
    isAccessConfig: any;
    filter = '';
    dbList = [];

    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private service: StatisticService,
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private translateService: TranslateService
    ) {
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin =
        userData &&
        userData.user &&
        userData.user.admin &&
        userData.user.admin === true;
    }
    ngOnInit() {
        if (this.isAdmin) {
            this.isAccess = PreferencesComponentMapping.accessMapping.admin[this.pageID];
            this.isAccessConfig = PreferencesComponentMapping.accessMapping.admin[`${this.pageID}-config`];
        } else {
            this.isAccess = PreferencesComponentMapping.accessMapping.commonUser[this.pageID];
            this.isAccessConfig = PreferencesComponentMapping.accessMapping.commonUser[`${this.pageID}-config`];
        }
        this.columns = PreferencesComponentMapping.pagesStructureMapping.admin[this.pageID];
        this.specialColumns =  PreferencesComponentMapping.specialColumns;
        this.configColumns = PreferencesComponentMapping.pagesStructureMapping.admin[`${this.pageID}-config`];
    }
    ngAfterViewInit() {
        this.updateData();
    }
    async updateData() {
        this.isLoading = true;
        let response;
        let configResponse;
        this.dataSource = new MatTableDataSource([{}]);
        this.configSource = new MatTableDataSource([{}]);
        this.dataSource.paginator = this.paginator;
        this.configSource.paginator = this.configPaginator;
        this.dataSource.sort = this.sorter;
        this.configSource.sort = this.configSorter;
        this.cdr.detectChanges();
        try {
            response = await this.service.getDbStats().toPromise();
            this.isLoading = false;
            const res = Object.values(response.data);
            this.dataSource.data =
                res.map((item: StatsDb) => ({
                    Name: item.database_name,
                    Version: item.database_version,
                    'Last Error': item.last_error,
                    'Latency AVG':
                        (item.latency_avg / 1000000000).toFixed(3) +
                        ' s.',
                    'Latency Min':
                        (item.latency_min / 1000000000).toFixed(3) +
                        ' s.',
                    'Latency Max':
                        (item.latency_max / 1000000000).toFixed(3) +
                        ' s.',
                    'Last Check': new Date(
                        Date.parse(item.last_check)
                    ).toString(),
                    'DB Stats':
                        JSON.stringify(item.db_stats).slice(0, 40) +
                        ' . . .',
                    item: item,
                }));
            this.isErrorResponse = false;
        } catch (err) {
            this.isErrorResponse = true;
        }
        try {
            configResponse = await this.service.getConfigStats().toPromise();
            const configRes = Object.values(configResponse.data);
            this.dbList = [...configRes];
            if (configRes) {
                this.isConfigTab = true;
                this.configSource.data =
                    configRes.map((item: StatsDb) => ({
                        Name: item.database_name,
                        Version: item.database_version,
                        'Last Error': item.last_error,
                        'Latency AVG':
                            (item.latency_avg / 1000000000).toFixed(3) +
                            ' s.',
                        'Latency Min':
                            (item.latency_min / 1000000000).toFixed(3) +
                            ' s.',
                        'Latency Max':
                            (item.latency_max / 1000000000).toFixed(3) +
                            ' s.',
                        'Last Check': new Date(
                            Date.parse(item.last_check)
                        ).toString(),
                        'DB Stats':
                            JSON.stringify(item.db_stats).slice(0, 40) +
                            ' . . .',
                        item: item,
                    }));
            }
            this.isErrorResponse = false;

        } catch (err) {
            this.isErrorResponse = true;
        }
        this.cdr.detectChanges();
        this.applyFilter();
    }
    applyFilter() {
        this.dataSource.filter = this.filter.trim().toLowerCase();
        this.configSource.filter = this.filter.trim().toLowerCase();
        this.cdr.detectChanges();
    }
    tabChanged() {
        this.filter = '';
        this.applyFilter();
    }
    ngOnDestroy() {

    }
    settingDialog(item: any = null, type?: string) {
        const isCopy = type === 'copy';
        let _result;
        const onOpenDialog = (result) => {
            if (!result) {
                return;
            }
            _result = result;
            result.isCopy = isCopy;
            this.service[result.isnew ? 'add' : (isCopy ? 'copy' : 'update')](result.data)
                .toPromise()
                .then(() => {
                    this.updateData();
                    this.alertService.success(`${this.page} Successfully ${(result.isnew ? 'Added' : (isCopy ? 'Copied' : 'Updated'))}`);
                }, () => {
                    this.alertService.error(`Failed to ${(result.isnew ? 'Add' : (isCopy ? 'Copy' : 'Update'))} ${this.page}`)
                });
        };

        this.openDialog(DialogUsersComponent, item, onOpenDialog, isCopy);
    }
    async openDialog(dialog, data: any = null, cb: Function = null, isCopy = false) {
        const result = await this.dialog
            .open(dialog, {
                width: '800px',
                data: { data, isnew: data === null, isCopy },
            })
            .afterClosed()
            .toPromise();
        if (cb && result) {
            if (result?.data) {
                result.data = this.jsonValidateAndForrmatted(result.data);
            }
            cb(result);
            this.cdr.detectChanges();
        }
    }
    private jsonValidateAndForrmatted(data) {
        Object.keys(data).forEach((item) => {
            if (typeof data[item] === 'string') {
                try {
                    data[item] = JSON.parse(data[item]);
                } catch (e) { }
            }
        });
        this.cdr.detectChanges();
        return data;
    }
    onResync(item: any) {
        let tableList = [];
        this.service.getTableList().toPromise().then( data => {
            tableList = data.data;
            const dbList = this.dbList.map(m => m.database_name);
            const syncData = {
                node_src : '',
                node_dst: item.database_name,
                tables: [],
                db_list: dbList,
                table_list: tableList
            };
            this.openDialog(
                DialogDBSelectorComponent,
                syncData,
                (result) => {
                    if (result.data) {
                        const resync = {
                            node_src : '',
                            node_dst: '',
                            tables: []
                            };

                        (d => {
                            resync.node_src = d.node_src;
                            resync.node_dst = d.node_dst;
                            resync.tables = d.tables;
                        })(result.data);

                        this.service.resync(resync).toPromise().then( statsData => {
                            
                            this.translateService.get('notifications.success.resync').subscribe(res => { 
                                this.alertService.success(res);   
                            })
                            this.cdr.detectChanges();
                        });

                    }
                }
            );

        });
    }
}
