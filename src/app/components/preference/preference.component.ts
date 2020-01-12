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
        // (Users) Firstname / Lastname / Username / Email / Action
        users: ['Firstname', 'Lastname', 'Username', 'Email', 'tools'],

        // (User Settings) Username / Partid / Category / Param / Data / Action
        'user settings': ['Username', 'Partid', 'Category', 'Param', 'Data', 'tools'],

        // (Alias) IP Address / Port / Mask / CaptureID / Status / Action
        alias: ['Alias', 'IP Address', 'Port', 'Mask', 'CaptureID', 'Status', 'tools'],

        // (Advanced Settings) Partid / Category / Param / Data / Action
        advanced: ['Partid', 'Category', 'Param', 'Data', 'tools'],

        // (Mapping Settings) Partid / Profile / HEP alias / HEP ID / Retention / Mapping / Action
        mapping: ['Partid', 'Profile', 'HEP alias', 'HEP ID', 'Retention', 'Mapping', 'tools'],

        // (HepSub Settings) Profile / HEP alias / HEP ID / Version / HepSub / Action
        hepsub: ['Profile', 'HEP alias', 'HEP ID', 'Version', 'HepSub', 'tools'],

    }
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

    updateData () {
        this.isLoading = true;
        switch (this.pageId) {
            case this.links[0]: /* users */
                const subscription_pus = this._pus.getAll().subscribe(data => {
                    subscription_pus.unsubscribe();

                    this.dataSource = data['data'].map(item => {
                        return {
                            'Firstname': item.firstname,
                            'Lastname': item.lastname,
                            'Username': item.username,
                            'Email': item.email,
                            item: item
                        };
                    });
                    this.isLoading = false;
                });
                break;
            case this.links[1]: /* user settings */
                const subscription_puss = this._puss.getAll().subscribe(data => {
                    subscription_puss.unsubscribe();
                    this.dataSource = data['data'].map(item => {
                        return {
                            Username: item.username,
                            Partid: item.partid,
                            Category: item.category,
                            Param: item.param,
                            data: JSON.stringify(item.data).slice(0, 40) + ' . . .',
                            item: item
                        };
                    });
                    this.isLoading = false;
                });
                break;
            case this.links[2]: /* alias */
                const subscription_pas = this._pas.getAll().subscribe(data => {
                    subscription_pas.unsubscribe();
                    // 'IP Address':0;'Port':0;'Mask':0;'CaptureID':0;'Status'
                    this.dataSource = data['data'].map(item => {
                        return {
                            Alias: item.alias,
                            'IP Address': item.ip,
                            Port: item.port,
                            Mask: item.mask,
                            CaptureID: item.captureID,
                            Status: item.status,
                            item: item
                        };
                    });
                    this.isLoading = false;
                });
                break;
            case this.links[3]: /* advanced */
                const subscription_pads = this._pads.getAll().subscribe(data => {
                    subscription_pads.unsubscribe();
                    this.dataSource = data['data'].map(item => {
                        return {
                            Partid: item.partid,
                            Category: item.category,
                            Param: item.param,
                            Data: JSON.stringify(item.data).slice(0, 40) + ' . . .',
                            item: item
                        };
                    });
                    this.isLoading = false;
                });
                break;
            case this.links[4]: /* mapping */
                const subscription_pmps = this._pmps.getAll().subscribe(data => {
                    subscription_pmps.unsubscribe();
                    this.dataSource = data['data'].map(item => {
                        return {
                            'Partid': item.partid,
                            'Profile': item.profile,
                            'HEP alias': item.hep_alias,
                            'HEP ID': item.hepid,
                            'Retention': item.retention,
                            'Mapping': item.mapping_settings,
                            item: item
                        };
                    });
                    this.isLoading = false;
                });
                break;
            case this.links[5]: /* hepsub */
                const subscription_phs = this._phs.getAll().subscribe(data => {
                    subscription_phs.unsubscribe();
                    this.isLoading = false;
                }, err => {
                    this.isLoading = true;
                    alert('error reques : 503');
                });
                break;
        }
    }

    openDialog(type: any, data: any = null, cb: Function = null): void {
        const dialogRef = this.dialog.open(type, {
            width: '800px',
            data: {
                data: data,
                isnew: data === null
            }
        });

        const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
            if (cb) {
                cb(result);
            }
            dialogRefSubscription.unsubscribe();
        });
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
                const subscription = this.service[this.pageId][result.isnew ? 'add' : 'update'](result.data).subscribe(data => {
                    subscription.unsubscribe();
                    this.updateData();
                });
            }
        });
    }

    onDelete (item: any = null) {
        this.openDialog(DialogDeleteAlertComponent, null, result => {
            if (result) {
                const subscription = this.service[this.pageId].delete(item.guid).subscribe(data => {
                    subscription.unsubscribe();
                    this.updateData();
                });
            }
        });
    }

    ngOnDestroy () {
    }

}
