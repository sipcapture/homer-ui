import {
    Component,
    OnInit,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    Input
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
    PreferenceAdvancedService,
} from '@app/services/preferences/index';
import {
    DialogDeleteAlertComponent,
    DialogAdvancedComponent,
} from '@app/components/preference/dialogs';
import {
    PreferenceAdvanced,
} from '@app/models';

import { AlertService, AuthenticationService } from '@app/services';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';
import { Functions } from '@app/helpers/functions';
@Component({
  selector: 'app-page-advanced-settings',
  templateUrl: './page-advanced-settings.component.html',
  styleUrls: ['./page-advanced-settings.component.scss']
})
export class PageAdvancedSettingsComponent implements OnInit, AfterViewInit, OnDestroy {

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

    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private service: PreferenceAdvancedService,
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef,
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
                    response = await this.service.getAll(0).toPromise();
                    this.isLoading = false;
                    this.dataSource.data =
                        response.data.map((item: PreferenceAdvanced) => ({
                            Partid: item.partid,
                            Category: item.category,
                            Param: item.param,
                            Data:
                                JSON.stringify(item.data).slice(0, 50) +
                                ' . . .',
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
                })
        };
        if (item) {
            item.type = type;
        } 
        this.openDialog(DialogAdvancedComponent, Functions.cloneObject(item), onOpenDialog, isCopy);
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
