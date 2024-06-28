import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    Input
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
    PreferenceAliasService,
    PreferenceIpAliasService
} from '@app/services/preferences/index';
import {
    DialogAliasComponent,
    DialogDeleteAlertComponent,

} from '@app/components/preference/dialogs';
import {
    PreferenceAlias,
    PreferenceIpAlias,
} from '@app/models';
import { AlertService, AuthenticationService } from '@app/services';
import { DialogImportComponent } from '@app/components/preference/service-dialogs';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';

import  moment from 'moment';
import { Functions } from '@app/helpers/functions';
@Component({
    selector: 'app-page-alias',
    templateUrl: './page-alias.component.html',
    styleUrls: ['./page-alias.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PageAliasComponent implements OnInit, OnDestroy, AfterViewInit {
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
        private service: PreferenceAliasService,
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
                  response = await this.service.getAll().toPromise()
                    this.isLoading = false;
                    this.dataSource.data =
                        response.data.map((item: PreferenceAlias) => ({
                            GUID: item.guid,
                            // 'Shard ID': item.shardid,
                            'CaptureID': item.captureID,
                            Alias: item.alias,
                            // 'IP Object': JSON.stringify(item.ipobject).slice(0, 35) +  ' . . .',
                            'IP Address': item.ip,
                            Mask: item.mask,
                            // IPV6: item.ipv6,
                            Port: item.port,
                            // 'Group Name': item.group,
                            // 'Server Type': item.servertype,
                            // Type: item.type,
                            Status: item.status ? 'Active' : 'Inactive',
                            item: item,
                        }));
                    this.isErrorResponse = false;
                } catch (err) {
                    console.log(err)
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
                });
        };
        if (item) {
            item.actionType = type;
        }
        this.openDialog(DialogAliasComponent, Functions.cloneObject(item), onOpenDialog, isCopy);
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
    //     const data = {
    //         pageId: this.page,
    //     };
    //     this.openDialog(DialogImportComponent, data, (result) => {
    //         if (result?.isUploaded) {
    //             this.updateData();
    //         }
    //         return;
    //     });
    //     this.cdr.detectChanges();
    }
    exportCSV() {
    //     return;
    //     this.service.export().subscribe((csv) => {
    //         const newBlob = new Blob([csv], {
    //             type: 'text/csv;charset=utf-8;',
    //         });
    //       const { msSaveOrOpenBlob } = (window.navigator as any) || {};
    //         if (msSaveOrOpenBlob) {
    //             msSaveOrOpenBlob(newBlob);
    //             return;
    //         }
    //         const data = window.URL.createObjectURL(newBlob);
    //         const link = document.createElement('a');
    //         link.href = data;
    //         link.download = `homer_${this.page.replace(/\s/, '_')}_export-${moment().format('YYYYMMDD-HHmmss')}.csv`;
    //         link.dispatchEvent(
    //             new MouseEvent('click', {
    //                 bubbles: true,
    //                 cancelable: true,
    //                 view: window,
    //             })
    //         );
    //         setTimeout(() => {
    //             window.URL.revokeObjectURL(data);
    //             link.remove();
    //         }, 100);
    //     });
    }
}
