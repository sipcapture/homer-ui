import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { ActivatedRoute, Router, ActivationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import {
    PreferenceUserService,
    PreferenceUserSettingsService,
    PreferenceAliasService,
    PreferenceMappingProtocolService,
    PreferenceHepsubService,
    PreferenceAgentsubService,
    PreferenceAuthKeyService,
    PreferenceAdvancedService
} from '@app/services/preferences/index';

import {
    DialogAdvancedComponent,
    DialogAliasComponent,
    DialogDeleteAlertComponent,
    DialogAuthTokenDisplayComponent,
    DialogHepsubComponent,
    DialogAgentsubComponent,
    DialogMappingComponent,
    DialogUserSettingsComponent,
    DialogAuthKeyComponent,
    DialogUsersComponent
} from '@app/components/preference/dialogs';

import {
    PreferenceUsers,
    PreferenceAdvanced,
    PreferenceAlias,
    PreferenceUsersSettings,
    PreferenceMapping,
    PreferenceHepsub,
    PreferenceAuthKey,
    PreferenceAgentsub
} from '@app/models';
import { AuthenticationService } from '@app/services';
import { DashboardService } from '../../services/dashboard.service';
import { SessionStorageService } from '../../services/session-storage.service';


@Component({
    selector: 'app-preference',
    templateUrl: './preference.component.html',
    styleUrls: ['./preference.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferenceComponent implements OnInit, OnDestroy, AfterContentChecked {
    isLoading = false;
    isAdmin = false;
    isHasLocalStorage = false;

    public pageId: string;
    public links: Array<string> = [];

    public dialogs = {
        users: DialogUsersComponent,
        'user settings': DialogUserSettingsComponent,
        alias: DialogAliasComponent,
        advanced: DialogAdvancedComponent,
        mapping: DialogMappingComponent,
        hepsub: DialogHepsubComponent,
        'auth token': DialogAuthKeyComponent,
        agentsub: DialogAgentsubComponent
    };

    service: any;

    public pagesStructure: any = {};

    dataSource = new MatTableDataSource([{}]);
    isAccess = {};

    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private _route: ActivatedRoute,
        private _pus: PreferenceUserService,
        private _puss: PreferenceUserSettingsService,
        private _pas: PreferenceAliasService,
        private _pads: PreferenceAdvancedService,
        private _pmps: PreferenceMappingProtocolService,
        private _phs: PreferenceHepsubService,
        private _aks: PreferenceAuthKeyService,
        private _pags: PreferenceAgentsubService,
        public dialog: MatDialog,
        private changeDetectorRefs: ChangeDetectorRef,
        private dashboardService: DashboardService,
        private sessionStorageService: SessionStorageService
    ) {
        this.changeDetectorRefs.detach();
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin = userData && userData.user && userData.user.admin && userData.user.admin === true;

        if (this.isAdmin) {
            this.isAccess = {
                users: {
                    add: true,
                    edit: true,
                    delete: true
                },
                'user settings': {
                    add: true,
                    edit: true,
                    delete: true
                },
                alias: {
                    add: true,
                    edit: true,
                    delete: true
                },
                advanced: {
                    add: true,
                    edit: true,
                    delete: true
                },
                mapping: {
                    add: true,
                    edit: true,
                    delete: true
                },
                hepsub: {
                    add: true,
                    edit: true,
                    delete: true
                },
                'auth token': {
                    add: true,
                    edit: true,
                    delete: true
                },
                agentsub: {
                    add: false,
                    edit: false,
                    delete: true
                },
            };

            this.pagesStructure = {
                users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],
                'user settings': ['Username', 'Category', 'Param', 'tools'],
                alias: ['Alias', 'IP Address', 'Port', 'Mask', 'CaptureID', 'Status', 'tools'],
                advanced: ['Category', 'Param', 'tools'],
                mapping: ['Profile', 'HEP alias', 'HEP ID', 'tools'],
                hepsub: ['Profile', 'HEP alias', 'HEP ID', 'Version', 'HepSub', 'tools'],
                'auth token': ['GUID', 'Name', 'Create Date', 'Expire Date', 'Active', 'tools'],
                agentsub: ['UUID', 'Host', 'Port', 'Node', 'Type', 'Expire', 'tools'],
            };

            this.service = {
                users: this._pus,
                'user settings': this._puss,
                alias: this._pas,
                advanced: this._pads,
                mapping: this._pmps,
                hepsub: this._phs,
                'auth token': this._aks,
                agentsub: this._pags
            };

            this.links = [
                'users',
                'user settings',
                'alias',
                'advanced',
                'mapping',
                'hepsub',
                'auth token',
                'agentsub',
                'reset'
            ]
        } else {
            this.pagesStructure = {
                users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],
                'user settings': ['Username', /*'Partid',*/ 'Category', 'Param', 'Data', 'tools'],
                advanced: [/*'Partid',*/ 'Category', 'Param', 'Data'],
            };

            this.service = {
                users: this._pus,
                'user settings': this._puss,
                advanced: this._pads,
            };

            this.links = [
                'users',
                'user settings',
                'advanced',
            ]

            this.isAccess = {
                users: {
                    add: false,
                    edit: true,
                    delete: false,
                },
                'user settings': {
                    add: true,
                    edit: true,
                    delete: true
                },
                alias: {
                    add: false,
                    edit: false,
                    delete: false
                },
                advanced: {
                    add: false,
                    edit: false,
                    delete: false
                },
                mapping: {
                    add: false,
                    edit: false,
                    delete: false
                },
                hepsub: {
                    add: false,
                    edit: false,
                    delete: false
                },
                'auth token': {
                    add: false,
                    edit: false,
                    delete: false
                },
                agentsub: {
                    add: false,
                    edit: false,
                    delete: true
                }
            };
        }
        router.events.pipe(
            filter(e => e instanceof ActivationEnd)
        ).subscribe((evt: ActivationEnd) => {
            this.pageId = decodeURI(evt.snapshot.params['id']);
            this.changeDetectorRefs.detectChanges();
        });
    }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.pageId = decodeURI(params['id']);
            this.updateData();
            this.changeDetectorRefs.detectChanges();
        });
        this.changeDetectorRefs.detectChanges();
    }
    ngAfterContentChecked() {
        // this.changeDetectorRefs.detectChanges();
    }
    async updateData() {
        this.isLoading = true;
        let response;
        this.changeDetectorRefs.detectChanges();
        switch (this.pageId) {
            case 'users':
                try {
                    response = await this._pus.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceUsers) => ({
                            Firstname: item.firstname,
                            Lastname: item.lastname,
                            Username: item.username,
                            Email: item.email,
                            item: item
                        })));
                    this.isLoading = false;
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error request');
                    this.changeDetectorRefs.detectChanges();
                }

                break;
            case 'user settings':
                try {
                    response = await this._puss.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceUsersSettings) => ({
                            Username: item.username,
                            Partid: item.partid,
                            Category: item.category,
                            Param: item.param,
                            item: item
                        })));
                    this.isLoading = false;
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error request');
                    this.changeDetectorRefs.detectChanges();
                }
                break;
            case 'alias':
                try {
                    response = await this._pas.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceAlias) => ({
                            Alias: item.alias,
                            'IP Address': item.ip,
                            Port: item.port,
                            Mask: item.mask,
                            CaptureID: item.captureID,
                            Status: item.status,
                            item: item
                        })));
                    this.isLoading = false;
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error request');
                    this.changeDetectorRefs.detectChanges();
                }

                break;
            case 'advanced':
                try {
                    response = await this._pads.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceAdvanced) => ({
                            Partid: item.partid,
                            Category: item.category,
                            Param: item.param,
                            item: item
                        })));
                    this.isLoading = false;
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error request');
                    this.changeDetectorRefs.detectChanges();
                }

                break;
            case 'mapping':
                try {
                    response = await this._pmps.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceMapping) => ({
                            Partid: item.partid,
                            Profile: item.profile,
                            'HEP alias': item.hep_alias,
                            'HEP ID': item.hepid,
                            Retention: item.retention,
                            Mapping: item.correlation_mapping,
                            item: item
                        })));
                    this.isLoading = false;
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error reques : 503');
                    this.changeDetectorRefs.detectChanges();
                }
                break;
            case 'auth token':
                try {
                    response = await this._aks.getAll().toPromise();
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceAuthKey) => ({
                            GUID: item.guid,
                            Name: item.name,
                            'Create Date': item.create_date,
                            'Expire Date': item.expire_date,
                            Active: item.active,
                            item: item
                        })));
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error request');
                    this.changeDetectorRefs.detectChanges();
                }
                this.isLoading = false;
                this.changeDetectorRefs.detectChanges();
                break;
            case 'hepsub':
                try {
                    response = await this._phs.getAll().toPromise();
                    this.isLoading = false;
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceHepsub) => ({
                            'HEP alias': item.hep_alias,
                            'HEP ID': item.hepid,
                            Profile: item.profile,
                            Version: item.version,
                            HepSub: JSON.stringify(item.mapping).slice(0, 40) + ' . . .',
                            item: item
                        })));
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error reques : 503');
                    this.changeDetectorRefs.detectChanges();
                }
                break;
            case 'agentsub':
                try {
                    response = await this._pags.getAll().toPromise();
                    this.isLoading = false;
                    this.dataSource = new MatTableDataSource(response.data.map(
                        (item: PreferenceAgentsub) => ({
                            'UUID': item.uuid,
                            'Host': item.host,
                            Port: item.port,
                            Node: item.node,
                            Type: item.type,
                            Expire: item.expire_date,
                            item: item
                        })));
                    this.changeDetectorRefs.detectChanges();
                } catch (err) {
                    this.isLoading = false;
                    alert('error reques : 503');
                    this.changeDetectorRefs.detectChanges();
                }
                break;
        }
        this.changeDetectorRefs.detectChanges();
    }
    async openDialog(type: any, data: any = null, cb: Function = null) {
        const result = await this.dialog.open(type, {
            width: '800px', data: { data, isnew: data === null }
        }).afterClosed().toPromise();

        if (cb && result) {
            if (result.data) {
                result.data = this.jsonValidateAndForrmatted(result.data);
            }
            cb(result);
            this.changeDetectorRefs.detectChanges();
        }
    }
    private jsonValidateAndForrmatted(data): any {
        Object.keys(data).forEach(item => {
            if (typeof data[item] === 'string') {
                try {
                    data[item] = JSON.parse(data[item]);
                } catch (e) { }
            }
        });
        return data;
    }
    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    preferenceGo(id: string) {
        this.router.navigate(['preference/' + encodeURI(id).toLowerCase()]);
        this.changeDetectorRefs.detectChanges();
    }

    settingDialog(item: any = null) {
        let _result;

        const onOpenDialogAuth = result2 => result2 && this.service[this.pageId]
            .delete(item.guid).toPromise().then(this.updateData.bind(this));

        const onServiceRes = response => {
            if (this.pageId === 'auth token' && _result.isnew && response.data) {
                this.openDialog(DialogAuthTokenDisplayComponent, response.data, onOpenDialogAuth);
            }
            this.updateData();
            this.changeDetectorRefs.detectChanges();
        };

        const onOpenDialog = result => {
            if (!result) {
                return;
            }
            _result = result;
            this.service[this.pageId][result.isnew ? 'add' : 'update'](result.data).toPromise().then(onServiceRes);
            this.changeDetectorRefs.detectChanges();
        };

        this.openDialog(this.dialogs[this.pageId], item, onOpenDialog);
        this.changeDetectorRefs.detectChanges();
    }

    onDelete(item: any = null) {
        this.openDialog(DialogDeleteAlertComponent, null, result =>
            result && this.service[this.pageId].delete(item.guid || item.uuid).toPromise().then(this.updateData.bind(this)));
        this.changeDetectorRefs.detectChanges();
    }
    onClearLocalData() {
        Object.keys(localStorage.valueOf()).filter(i => i !== 'currentUser').forEach(i => localStorage.removeItem(i));
        this.dashboardService.clearLocalStorage();
        this.sessionStorageService.clearLocalStorage();
        this.changeDetectorRefs.detectChanges();
    }
    getLocalStorageStatus(): any {
        return Object.keys(localStorage.valueOf()).filter(i => i !== 'currentUser').length > 0;
    }

    ngOnDestroy() {
    }

}
