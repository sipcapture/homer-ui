
import {
    Component,
    OnInit,
    OnDestroy,
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
    PreferenceAuthKeyService
} from '@app/services/preferences/index';
import {
    DialogDeleteAlertComponent,
    DialogAuthKeyComponent,
    DialogAuthTokenDisplayComponent,
} from '@app/components/preference/dialogs';
import {
    PreferenceAuthKey,
} from '@app/models';

import { AlertService, AuthenticationService, TimeFormattingService } from '@app/services';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';

@Component({
  selector: 'app-page-api-auth',
  templateUrl: './page-api-auth.component.html',
  styleUrls: ['./page-api-auth.component.scss']
})
export class PageApiAuthComponent implements OnInit, AfterViewInit, OnDestroy {
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
    dateFormat: string;

    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private service: PreferenceAuthKeyService,
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _tfs: TimeFormattingService
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
            this.columns = PreferencesComponentMapping.pagesStructureMapping.admin[this.pageID];
        } else {
            this.isAccess = PreferencesComponentMapping.accessMapping.commonUser[this.pageID];
            this.columns = PreferencesComponentMapping.pagesStructureMapping.commonUser[this.pageID];
        }
        this.specialColumns =  PreferencesComponentMapping.specialColumns;
    }
    async getFormat() {
        this.dateFormat = await this._tfs.getFormat().then(res => res.dateTime);
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
                        response.data.map((item: PreferenceAuthKey) => ({
                            UUID: item.guid,
                            Name: item.name,
                            'Create Date': item.create_date,
                            'Expire Date': item.expire_date,
                            Active: item.active,
                            'Limit Calls': item.limit_calls,
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
        const isCopy = type === 'copy';
        let _result;
        const onOpenDialogAuth = (result2) =>
            result2 &&
            this.service
                .delete(item.uuid)
                .toPromise()
                .then(this.updateData.bind(this));

        const onServiceRes = (response) => {
            if (
                _result.isnew &&
                response.data
            ) {
                this.openDialog(
                    DialogAuthTokenDisplayComponent,
                    response.data,
                    onOpenDialogAuth
                );
            }
            this.updateData();
            this.alertService.success(`${this.page} Successfully ${(_result.isnew ? 'Added' : (isCopy ? 'Copied' : 'Updated'))}`);
        };

        const onOpenDialog = (result) => {
            if (!result) {
                return;
            }
            _result = result;
            result.isCopy = isCopy;
            this.service[result.isnew ? 'add' : (isCopy ? 'copy' : 'update')](result.data)
                .toPromise()
                .then(onServiceRes, () => {
                    this.alertService.error(`Failed to ${(result.isnew ? 'Add' : (isCopy ? 'Copy' : 'Update'))} ${this.page}`)
                });
        };

        this.openDialog(DialogAuthKeyComponent, item, onOpenDialog, isCopy);
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
}
