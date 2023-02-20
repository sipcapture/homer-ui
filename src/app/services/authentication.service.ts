import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User, UserJWT } from '@app/models';
import { PreferenceUserSettingsService } from './preferences/user-settings.service';
import * as _moment from 'moment';
import { ConstValue } from '../models/const-value.model';
import { AlertService } from './alert.service';
import { Functions, setStorage } from '@app/helpers/functions';
import { TranslateService } from '@ngx-translate/core';
import jwt_decode from 'jwt-decode';

const moment: any = _moment;

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private currentUserSubject: BehaviorSubject<User>;
    public currentUser: Observable<User>;

    constructor(
        private http: HttpClient,
        private preferenceUserSettingsService: PreferenceUserSettingsService,
        private alertService: AlertService,
        private translateService: TranslateService
    ) {
        let ls: any;
        try {
            ls = JSON.parse(localStorage.getItem(ConstValue.CURRENT_USER));
            if (ls) {
                const decodedToken = jwt_decode<UserJWT>(ls.token);
                if (moment().unix() > decodedToken?.exp) {
                    throw 'Expired JWT';
                }
            }
        } catch (err) {
            console.error(err);
            setTimeout(() => {
                this.translateService.get('notifications.error.invalidJWT').subscribe(res => { 
                    this.alertService.error(res);
                })
            }, 100);
        }
        this.currentUserSubject = new BehaviorSubject<User>(ls);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }
    getUserName(): string {
        return Functions.JSON_parse(localStorage.getItem(ConstValue.CURRENT_USER))?.user?.username;
    }
    getAuthList() {
        return this.http.get<any>(`${environment.apiUrl}/auth/type/list`);
    }
    loginOAuth(token: string) {
        return this.http.post<any>(`${environment.apiUrl}/oauth2/token`, { token })
            .pipe(map(user => {
                // login successful if there's a jwt token in the response
                if (user?.token ) {
                    user.user.isExternal = true;
                    user.user.username = "OAuth";
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    setStorage(ConstValue.CURRENT_USER, user);
                    this.currentUserSubject.next(user);
                    setTimeout(() => {
                        this.getUserSettingTimeZone(user, "OAuth");
                    });
                } else {
                    user.user.username = "OAuth";
                    this.currentUserSubject.next(user);
                    setTimeout(() => {
                        this.getUserSettingTimeZone(user, "OAuth");
                    });
                }
                return user;
            }));
    }
    login(username: string, password: string, type: string) {
        return this.http.post<any>(`${environment.apiUrl}/auth`, { username, password, type })
            .pipe(map(user => {
                // login successful if there's a jwt token in the response
                if (user?.token ) {
                    user.user.username = username;
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    setStorage(ConstValue.CURRENT_USER, user);
                    this.currentUserSubject.next(user);
                    setTimeout(() => {
                        this.getUserSettingTimeZone(user, username);
                    });
                } else {
                    user.user.username = username;
                    this.currentUserSubject.next(user);
                    setTimeout(() => {
                        this.getUserSettingTimeZone(user, username);
                    });
                }
                return user;
            }));
    }
    async getUserSettingTimeZone(user, username) {
        try {
            const userSettingsData: any = await this.preferenceUserSettingsService.getCategory('system').toPromise();
            const timezoneItem = userSettingsData.data.filter(i =>
                i.category === 'system' &&
                i.username === username &&
                i.param === 'timezone');
            const [{ data }] = timezoneItem || [{}];
            if (data?.name) {
                user.timezone = data;
                moment.tz.setDefault(data.name);
                setStorage(ConstValue.CURRENT_USER, user);
            }
        } catch (err) { }
    }
    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem(ConstValue.CURRENT_USER);
        this.currentUserSubject.next(null);
    }
}
