import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, EventEmitter } from '@angular/core';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService } from '@app/services/authentication.service';
import { DashboardService } from '@app/services/dashboard.service';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { TranslateService } from '@ngx-translate/core'
import { environment } from '@environments/environment';
export interface DashboardConfig {
    name: string;
    type: number;
    gridType: string;
    param: string;
    shared: boolean;
    columns: number;
    maxrows: number;
    pushing: boolean;
    grafanaTimestamp: boolean;
    grafanaProxy: boolean;
    hasVariables: boolean;
}

@Component({
    selector: 'app-edit-dialog',
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDialogComponent implements OnInit {
    private envUrl = `${environment.apiUrl.replace('/api/v3', '')}`;
    onDeleteWidgets = new EventEmitter();
    onTile = new EventEmitter();
    isSameOrigin: boolean = false;
    typeList = [];
    typeBoolean = {
        CUSTOM: {
            isActive: true,
            type: 1
        },
        FRAME: {
            isActive: true,
            type: 2,
        },
        HOME: {
            isActive: true,
            type: 3
        },
        SEARCH: {
            isActive: true,
            type: 4,
        },
        ALARM: {
            isActive: true,
            type: 5
        },
        GRAFANA: {
            isActive: true,
            type: 7 // not an error, workaround because "Search TAB" is type 6
        }
    };
    isHomeOrSearch = false;
    isSEARCH = false;
    ignoreMinSizeList: { [key: string]: string } = {
        /* 'Limit': 'limit', */
        'Warning': 'warning',
        'Ignore': 'Ignore'
    };
    regString = /^[a-zA-Z0-9\-\_]+$/;
    name = new FormControl([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.regString)],
        this.validateName.bind(this));
    currentName = '';
    callBackExport: Function = null;
    dashboards: any;
    isInvalid = false;
    nameBuffer: string;
    dashboardTypesDictionary;
    constructor(
        public dialogRef: MatDialogRef<EditDialogComponent>,
        private dashboardService: DashboardService,
        private cdr: ChangeDetectorRef,
        private authenticationService: AuthenticationService,
        @Inject(MAT_DIALOG_DATA) public data: DashboardConfig,
        public dialog: MatDialog,
        private translateService: TranslateService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.isSEARCH = this.dashboardService.getCurrentDashBoardId() === 'search';
        this.isHomeOrSearch = this.isSEARCH || this.dashboardService.getCurrentDashBoardId() === 'home';
        ((d) => {
            this.name.setValue(d.name);
            this.currentName = d.name;
        })(this.data);
        this.dashboardService.getDashboardInfo().toPromise().then((list: any) => {
            if (list && list.data && list.data.length > 0) {
                this.typeBoolean.HOME.isActive = !list.data.find(i => i.id === 'home');
                if (!this.isSEARCH) {
                    this.typeBoolean.SEARCH.isActive = !list.data.find(i => i.id === 'search');
                }
            }
            this.typeList = Object.keys(this.typeBoolean).map(item => ({
                type: this.typeBoolean[item].type,
                name: item,
                disabled: !this.typeBoolean[item].isActive
            }));
            this.translateService.get('dashboard.editDialog.dashboardSettingsSection.dashboardTypes').subscribe(res => {
                this.dashboardTypesDictionary = res;
                this.typeList = Object.keys(this.typeBoolean).map(item => ({
                    type: this.typeBoolean[item].type,
                    name: res[item] || item,
                    disabled: !this.typeBoolean[item].isActive
                }));
                this.cdr.detectChanges();
            });
            if (data.shared === true && data.type === 3) {
                data.shared = false;
            }
            this.cdr.detectChanges();
        });
    }
    async ngOnInit() {
        this.isSameOrigin = this.envUrl === `${window.location.protocol}//${window.location.host}`;
        const resData: any = await this.dashboardService.getDashboardInfo(0).toPromise();
        const currentUser = this.authenticationService.getUserName();
        if (resData?.data) {
            this.dashboards = resData.data.sort((...aa: any[]) => {
                const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
                return a < b ? -1 : a > b ? 1 : 0;
            })
                .filter(item => item.shared === false || item.owner === currentUser)
                .map(dashboard => dashboard.name.replace(/\s+/, ' ').toLowerCase().trim());
        }
        this.nameBuffer = this.data.name.toLowerCase().trim();
        this.validate(this.data.name);
    }
    deleteWidgets() {
        this.dialog.open(DeleteDialogComponent, { width: '350px', data: {} }).afterClosed().toPromise().then(res => {
            if (res) {
                this.onDeleteWidgets.emit();
            }
        });
    }
    tileWidgets() {
        this.onTile.emit();
    }
    onExport() {
        if (this.callBackExport !== null) {
            this.callBackExport();
        }
    }
    export(cb: Function) {
        // console.log(cb)
        this.callBackExport = cb;
    }
    identify(index, item) {
        return item.id;
    }
    validate(event) {
        event = event?.toLowerCase().trim();
        if (
            (this.dashboards?.some(dashboard => dashboard === event?.replace(/\s+/, ' '))
                || event === 'home'
                || event === '')
            && event !== this.nameBuffer) {
            this.isInvalid = true;
        } else {
            this.isInvalid = false;
        }
        this.cdr.detectChanges();
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    validateName(nameValidator: AbstractControl) {
        return new Promise(resolve => {
            setTimeout(() => {
                let validated = false;
                this.isTaken(nameValidator.value).then(data => {
                    validated = data;
                    if (validated) {
                        resolve({ dashboardNameNotAvailable: true });
                    } else {
                        resolve(null);
                    }
                });
            }, 500);
        });
    }
    async isTaken(name) {
        if (this.dashboards?.length > 0) {
            return ([].concat(this.dashboards) || []).includes(name.toLowerCase()) && name !== this.currentName;
      }
      return null;
    }
    onSubmit() {
        if (
            !this.name?.invalid
        ) {
            (d => {
                d.name = this.name?.value;
            })(this.data);
            this.dialogRef.close(this.data);
        } else {
            this.name.markAsTouched();
        }
    }
}
