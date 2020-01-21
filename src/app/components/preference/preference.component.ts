import { Component, OnInit, OnDestroy } from '@angular/core';
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
    PreferenceAdvancedService
} from '@app/services/preferences/index';

import {
    DialogAdvancedComponent,
    DialogAliasComponent,
    DialogDeleteAlertComponent,
    DialogHepsubComponent,
    DialogMappingComponent,
    DialogUserSettingsComponent,
    DialogUsersComponent
} from '@app/components/preference/dialogs';

import {
    PreferenceUsers,
    PreferenceAdvanced,
    PreferenceAlias,
    PreferenceUsersSettings,
    PreferenceMapping,
    PreferenceHepsub
} from '@app/models';


@Component({
    selector: 'app-preference',
    templateUrl: './preference.component.html',
    styleUrls: ['./preference.component.css']
})
export class PreferenceComponent implements OnInit, OnDestroy {
    isLoading = false;
    public pageId: string;
    public links: Array<string> = [
        'users',
        'user settings',
        'alias',
        'advanced',
        'mapping',
        'hepsub'
    ];

    public dialogs = {
        users: DialogUsersComponent,
        'user settings': DialogUserSettingsComponent,
        alias: DialogAliasComponent,
        advanced: DialogAdvancedComponent,
        mapping: DialogMappingComponent,
        hepsub: DialogHepsubComponent
    };

    service: any;

    public pagesStructure: any = {
        users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],
        'user settings': ['Username', 'Partid', 'Category', 'Param', 'Data', 'tools'],
        alias: ['Alias', 'IP Address', 'Port', 'Mask', 'CaptureID', 'Status', 'tools'],
        advanced: ['Partid', 'Category', 'Param', 'Data', 'tools'],
        mapping: ['Partid', 'Profile', 'HEP alias', 'HEP ID', 'Retention', 'tools'],
        hepsub: ['Profile', 'HEP alias', 'HEP ID', 'Version', 'HepSub', 'tools'],
    };

    dataSource = new MatTableDataSource([{
    }]);

    constructor(
        private router: Router,
        private _route: ActivatedRoute,
        private _pus: PreferenceUserService,
        private _puss: PreferenceUserSettingsService,
        private _pas: PreferenceAliasService,
        private _pads: PreferenceAdvancedService,
        private _pmps: PreferenceMappingProtocolService,
        private _phs: PreferenceHepsubService,
        public dialog: MatDialog,
    ) {
        this.service = {
            users: this._pus,
            'user settings': this._puss,
            alias: this._pas,
            advanced: this._pads,
            mapping: this._pmps,
            hepsub: this._phs
        };

        router.events.pipe(
            filter(e => e instanceof ActivationEnd)
        ).subscribe((evt: ActivationEnd) => {
            this.pageId = decodeURI(evt.snapshot.params['id']);
        });
    }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.pageId = decodeURI(params['id']);
            this.updateData ();
        });
    }

    async updateData () {
        this.isLoading = true;
        let responce;
        switch (this.pageId) {
            case this.links[0]: /* users */
                responce = await this._pus.getAll().toPromise();

                this.dataSource = responce.data.map(
                    (item: PreferenceUsers) => ({
                        Firstname: item.firstname,
                        Lastname: item.lastname,
                        Username: item.username,
                        Email: item.email,
                        item: item
                }));
                this.isLoading = false;

                break;
            case this.links[1]: /* user settings */
                responce = await this._puss.getAll().toPromise();

                this.dataSource = responce.data.map(
                    (item: PreferenceUsersSettings) => ({
                        Username: item.username,
                        Partid: item.partid,
                        Category: item.category,
                        Param: item.param,
                        data: JSON.stringify(item.data).slice(0, 40) + ' . . .',
                        item: item
                }));
                this.isLoading = false;
                break;
            case this.links[2]: /* alias */
                responce = await this._pas.getAll().toPromise();

                this.dataSource = responce.data.map(
                    (item: PreferenceAlias) => ({
                        Alias: item.alias,
                        'IP Address': item.ip,
                        Port: item.port,
                        Mask: item.mask,
                        CaptureID: item.captureID,
                        Status: item.status,
                        item: item
                }));
                this.isLoading = false;

                break;
            case this.links[3]: /* advanced */
                responce = await this._pads.getAll().toPromise();
                this.dataSource = responce.data.map(
                    (item: PreferenceAdvanced) => ({
                        Partid: item.partid,
                        Category: item.category,
                        Param: item.param,
                        Data: JSON.stringify(item.data).slice(0, 50) + ' . . .',
                        item: item
                }));
                this.isLoading = false;

                break;
            case this.links[4]: /* mapping */
                responce = await this._pmps.getAll().toPromise();
                this.dataSource = responce.data.map(
                    (item: PreferenceMapping) => ({
                        Partid: item.partid,
                        Profile: item.profile,
                        'HEP alias': item.hep_alias,
                        'HEP ID': item.hepid,
                        Retention: item.retention,
                        Mapping: item.correlation_mapping,
                        item: item
                }));
                this.isLoading = false;

                break;
            case this.links[5]: /* hepsub */
                try {
                    responce = await this._phs.getAll().toPromise();
                    this.isLoading = false;
                    this.dataSource = responce.data.map(
                        (item: PreferenceHepsub) => ({
                            'HEP alias': item.hep_alias,
                            'HEP ID': item.hepid,
                            Profile: item.profile,
                            Version: item.version,
                            HepSub: JSON.stringify(item.mapping).slice(0, 40) + ' . . .',
                            item: item
                    }));
                } catch (err) {
                    this.isLoading = true;
                    alert('error reques : 503');
                }
                break;
        }
    }

    async openDialog(type: any, data: any = null, cb: Function = null) {
        const dialogRef = this.dialog.open(type, {
            width: '800px',
            data: {
                data: data,
                isnew: data === null
            }
        });

        const result = await dialogRef.afterClosed().toPromise();
        if (cb && result) {
            if (result.data) {
                result.data = this.jsonValidateAndForrmatted(result.data);
            }
            cb(result);
        }
    }
    private jsonValidateAndForrmatted (data) {
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
    }

    settingDialog (item: any = null) {
        this.openDialog(this.dialogs[this.pageId], item, result => {
            if (result) {
                this.service[this.pageId][result.isnew ? 'add' : 'update'](result.data).toPromise().then(() => {
                    this.updateData();
                });
            }
        });
    }

    onDelete (item: any = null) {
        this.openDialog(DialogDeleteAlertComponent, null, result => {
            if (result) {
                this.service[this.pageId].delete(item.guid).toPromise().then(() => {
                    this.updateData();
                });
            }
        });
    }

    ngOnDestroy () {
    }

}
