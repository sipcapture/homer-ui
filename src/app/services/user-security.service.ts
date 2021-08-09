import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { PreferenceUserSettingsService } from './preferences/user-settings.service';

enum Security {
    CATEGORY = 'security',
    PARAM = 'dashboard',
}

export enum DashboardFlag {
    ADD = 'add',
    UPDATE = 'update',
    DELETE = 'delete'
}
@Injectable({
    providedIn: 'root'
})
export class UserSecurityService {

    private isAdmin = false;
    private userSettings: any;

    constructor(
        private authenticationService: AuthenticationService,
        private preferenceUserSettingsService: PreferenceUserSettingsService
    ) {
        this.getAdmin();
    }
    public getAdmin() {
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin = userData && userData.user && userData.user.admin && userData.user.admin === true;
    }
    private getUserSettings() {
        let output: any;
        const username = this.authenticationService.getUserName()
        return new Promise((resolve, reject) => {
            if (!this.userSettings || this.userSettings.username !== username) {
                this.preferenceUserSettingsService.getAll().toPromise().then((userSettings: any) => {
                    const { data } = userSettings || {};
                    if (data) {
                        this.userSettings = data.find(i =>
                            i.category === Security.CATEGORY
                            && i.param === Security.PARAM
                            && i.username === username
                        );
                        output = this.userSettings;
                        resolve(output);
                    } else {
                        reject(userSettings);
                    }
                });
            } else {
                resolve(this.userSettings);
            }
        });
    }
    private async getFlag(type: string) {
        this.userSettings = await this.getUserSettings();
        const {data} = this.userSettings || {};
        if (data && data.support && data.support.dashboard && data.support.dashboard[type] != null) {
            return !!data.support.dashboard[type];
        }
        return this.isAdmin;
    }
    public async isDashboardAdd() {
        return await this.getFlag(DashboardFlag.ADD);
    }

    public async isDashboardUpdate() {
        return await this.getFlag(DashboardFlag.UPDATE);
    }

    public async isDashboardDelete() {
        return await this.getFlag(DashboardFlag.DELETE);
    }
    public removeUserSettings() {
        delete this.userSettings;
    }

}
