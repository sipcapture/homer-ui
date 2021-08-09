import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { ConstValue } from './../../models/const-value.model';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { UserSettings } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PreferenceUserSettingsService {
    private url = `${environment.apiUrl}/user/settings`;

    constructor(
        private http: HttpClient,
        private httpGetBuffer: HttpGetBuffer
    ) { }

    getUserDashboardWidgets(): Promise<any> {
        return this.http.get<any>(`${environment.apiUrl}/user/dashboard/widgets`).toPromise();
    }

    getAll(delayBuffer = 1000 * 30): Observable<any> {
        return this.httpGetBuffer.get<UserSettings[]>(this.url, delayBuffer)
            .pipe(map((response: any) => {
                const localdata = localStorage.getItem(ConstValue.CURRENT_USER);
                const { user } = Functions.JSON_parse(localdata);
                /**
                 * TODO: admin || shred === true
                 */
                const isAdmin = user?.admin || false;
                if (isAdmin) {
                    return response;
                }
                
                const { data } = response;
                const username = Functions.JSON_parse(localStorage.getItem(ConstValue.CURRENT_USER)).user.username;
                const outData = data?.filter((item: any) => item.username === username) || [];
                return {
                    count: outData.length,
                    data: outData
                };
            }));
    }

    getCategory(category: string): Observable<any> {
        return this.http.get<UserSettings[]>(`${this.url}/${category}`);
    }

    add(userSetting: UserSettings): Observable<any> {
        userSetting.guid = Functions.newGuid();
        userSetting.uuid = Functions.newGuid();
        return this.http.post(`${this.url}`, userSetting);
    }

    update(userSetting: UserSettings): Observable<any> {
        const { guid, uuid } = userSetting;
        return this.http.put(`${this.url}/${uuid || guid}`, userSetting);
    }

    delete(guid): Observable<any> {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
