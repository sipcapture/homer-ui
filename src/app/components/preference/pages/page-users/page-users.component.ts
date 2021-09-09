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
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
    PreferenceUserService
} from '@app/services/preferences/index';
import {
    DialogDeleteAlertComponent,
    DialogUsersComponent,
} from '@app/components/preference/dialogs';
import {
    PreferenceUsers,
} from '@app/models';

import { AlertService, AuthenticationService, UserSecurityService } from '@app/services';

import { DialogImportComponent } from '@app/components/preference/service-dialogs';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';

import * as moment from 'moment';
import { Functions } from '@app/helpers/functions';
@Component({
    selector: 'app-page-users',
    templateUrl: './page-users.component.html',
    styleUrls: ['./page-users.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PageUsersComponent implements OnInit, OnDestroy, AfterViewInit {
    isLoading = false;
    isAdmin = false;
    isErrorResponse = false;
    dataSource = new MatTableDataSource([{}]);
    @Input() page: string;
    @Input() pageID: string;
    @ViewChild(MatSort, { static: true }) sorter: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    columns = [];
    specialColumns = [];
    isAccess: any;
    filter = '';
    username = '';
    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private alertService: AlertService,
        private userSecurityService: UserSecurityService,
        private service: PreferenceUserService,
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef,
    ) {
        const userData = this.authenticationService.currentUserValue;
        this.username = userData.user.username;
        this.isAdmin =
        userData &&
        userData.user &&
        userData.user.admin &&
        userData.user.admin === true;
    }
    ngOnInit() {
        if (this.isAdmin) {
            this.isAccess = PreferencesComponentMapping.accessMapping.admin[this.pageID];
            this.columns = PreferencesComponentMapping.pagesStructureMapping.admin[this.pageID];
        } else {
            this.isAccess = PreferencesComponentMapping.accessMapping.commonUser[this.pageID];
            this.columns = PreferencesComponentMapping.pagesStructureMapping.commonUser[this.pageID];
        }
        this.specialColumns =  PreferencesComponentMapping.specialColumns;
    }
    ngAfterViewInit() {
        this.updateData();
    }
    async updateData() {
        this.isLoading = true;
        let response;
        this.dataSource = new MatTableDataSource([{}]);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sorter;

        this.cdr.detectChanges();
                try {
                    response = await this.service.getAll().toPromise();
                    this.isLoading = false;
                    this.dataSource.data =
                        response.data.map((item: PreferenceUsers) => ({
                            Firstname: item.firstname,
                            Lastname: item.lastname,
                            Username: item.username,
                            Email: item.email,
                            item: item,
                        }));
                    this.isErrorResponse = false;
                } catch (err) {
                    this.isErrorResponse = true;
                }
                this.cdr.detectChanges();
        this.applyFilter();
    }
    applyFilter() {
        this.dataSource.filter = this.filter.trim().toLowerCase();
        this.cdr.detectChanges();
    }
    ngOnDestroy() {

    }
    settingDialog(item: any = null, type?: string) {
        const bufferGroup = item?.usergroup;
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
                    if (_result.usergroup !== bufferGroup && _result.data.username === this.username) {
                        this.userSecurityService.removeUserSettings();
                        this.authenticationService.logout();
                        this.router.navigate([{ outlets: { primary: null, system: 'login' } }]);
                    }
                 });
            this.alertService.success(`${this.page} Successfully ${(result.isnew ? 'Added' : (isCopy ? 'Copied' : 'Updated'))}`);
        };

        this.openDialog(DialogUsersComponent, Functions.cloneObject(item), onOpenDialog, isCopy);
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
    deleteDialog(item: any = null) {
        const data = { page: this.page, message: 'delete'};
        this.openDialog(
            DialogDeleteAlertComponent,
            data,
            (result) => result && this.service.delete(item.uuid || item.guid)
                .toPromise()
                .then(this.updateData.bind(this)));
    }
    private jsonValidateAndForrmatted(data) {
        Object.keys(data).forEach((item) => {
            if (typeof data[item] === 'string') {
                // data[item] = Functions.JSON_parse(data[item]);
                try {
                    data[item] = JSON.parse(data[item]);
                } catch (e) { }
            }
        });
        this.cdr.detectChanges();
        return data;
    }
    onClickImport() {
        const data = {
            pageId: this.page,
        };
        this.openDialog(DialogImportComponent, data, (result) => {
            if (result?.isUploaded) {
                this.updateData();
            }
            return;
        });
        this.cdr.detectChanges();
    }
    exportCSV() {
        this.service.export().subscribe((csv) => {
            const newBlob = new Blob([csv], {
                type: 'text/csv;charset=utf-8;',
            });
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(newBlob);
                return;
            }
            const data = window.URL.createObjectURL(newBlob);
            const link = document.createElement('a');
            link.href = data;
            link.download = `homer_${this.page.replace(/\s/, '_')}_export-${moment().format('YYYYMMDD-HHmmss')}.csv`;
            link.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                })
            );
            setTimeout(() => {
                window.URL.revokeObjectURL(data);
                link.remove();
            }, 100);
        });
    }
}
