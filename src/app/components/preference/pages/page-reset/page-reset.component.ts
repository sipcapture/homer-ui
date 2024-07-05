import { Component, OnInit,
    ChangeDetectorRef,
    Input, } from '@angular/core';
import { ConstValue } from '@app/models';
import { DialogDeleteAlertComponent } from '../../dialogs';
import { AlertService, AuthenticationService, DashboardService, PreferenceMappingProtocolService, SessionStorageService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { HttpGetBuffer } from '@app/helpers/http-get-buffer';

@Component({
    selector: 'app-page-reset',
    templateUrl: './page-reset.component.html',
    styleUrls: ['./page-reset.component.scss']
})
export class PageResetComponent implements OnInit {
    isAdmin = false;
    isResetDashboard = true;
    isResetMapping = true;
    @Input() page: string;
    @Input() pageID: string;
    localDictionary;
    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private dashboardService: DashboardService,
        private sessionStorageService: SessionStorageService,
        private dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _pmps: PreferenceMappingProtocolService,
        private translateService: TranslateService,
        private _httpBuffer: HttpGetBuffer
        ) { 
            
        this.translateService.get('notifications').subscribe(res => { 
            this.localDictionary = res;
        })
        }

    ngOnInit(): void {
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin =
            userData &&
            userData.user &&
            userData.user.admin &&
            userData.user.admin === true;
    }
    onClearLocalData(isGlobal) {
        const data = { page: 'Local Data', message: 'reset' };
        const currentUser = this.authenticationService.getUserName();
        this.openDialog(DialogDeleteAlertComponent, data, (result) => {
            if (result && result === true) {
                Object.keys(localStorage.valueOf())
                    .filter((i) => i !== ConstValue.CURRENT_USER && (isGlobal || i.includes(currentUser)))
                    .forEach((i) => localStorage.removeItem(i));
                this.dashboardService.clearLocalStorage();
                this.sessionStorageService.clearLocalStorage();
                this.alertService.success(this.localDictionary.success.localStorageCleared);
            } else {
                this.alertService.error(this.localDictionary.error.localStorageNotCleared);
                return;
            }
        });
        this.cdr.detectChanges();
    }
    async openDialog(type: any, data: any = null, cb: Function = null, isCopy = false) {
        const result = await this.dialog
            .open(type, {
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
                // data[item] = Functions.JSON_parse(data[item]);
                try {
                    data[item] = JSON.parse(data[item]);
                } catch (e) { }
            }
        });
        this.cdr.detectChanges();
        return data;
    }
    onResetDashboard() {
        const data = { page: 'Dashboard', message: 'reset' };
        this.openDialog(DialogDeleteAlertComponent, data, (result) => {
            if (result && result === true) {
                this.dashboardService.resetDashboard().then(() => {
                    this.alertService.success(this.localDictionary.success.dashboardReset);
                    this._httpBuffer.removeAllSubPathsFromBuffer('dashboard');
                }, () => {

                    this.alertService.error(this.localDictionary.error.dashboardReset);
                })
            } else {
                this.alertService.error(this.localDictionary.error.dashboardReset);
                return;
            }
        });

        this.cdr.detectChanges();

    }
    onResetMappings() {
        const data = { page: 'Mappings', message: 'reset' };
        this.openDialog(DialogDeleteAlertComponent, data, (result) => {
            if (result && result === true) {
                const resData: any = this._pmps.resetMapping().toPromise();
                this.alertService.success(this.localDictionary.success.mappingsReset);
            } else {
                this.alertService.error(this.localDictionary.error.mappingsReset);
                return;
            }
        });

        this.cdr.detectChanges();
    }

}
