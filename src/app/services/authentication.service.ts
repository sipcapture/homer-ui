import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User } from '@app/models';
import { PreferenceUserSettingsService } from './preferences/user-settings.service';
import * as _moment from 'moment';
import { Functions } from '@app/helpers/functions';

const moment: any = _moment;

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private currentUserSubject: BehaviorSubject<User>;
    public currentUser: Observable<User>;

    constructor(
        private http: HttpClient,
        private preferenceUserSettingsService: PreferenceUserSettingsService
    ) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }

    login(username: string, password: string) {
        return this.http.post<any>(`${environment.apiUrl}/auth`, { username, password })
            .pipe(map(user => {
                // login successful if there's a jwt token in the response
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    user.user.username = username;
                    moment.tz.setDefault(moment.tz.guess());
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);
                }
                setTimeout(() => {
                    this.getUserSettingTimeZone(user, username);
                });
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

            if (timezoneItem && timezoneItem[0] && timezoneItem[0].data && timezoneItem[0].data.name) {
                user.timezone = timezoneItem[0].data;
                moment.tz.setDefault(user.timezone.name);
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        } catch (err) { }
    }
    getUserName(): string {
        return Functions.JSON_parse(localStorage.getItem('currentUser')).user.username;
    }
    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }
}
