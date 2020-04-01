import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { UserSettings } from '@app/models';
import { Functions } from '@app/helpers/functions';

@Injectable({
  providedIn: 'root'
})
export class PreferenceUserSettingsService {
    private url = `${environment.apiUrl}/user/settings`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<UserSettings[]>(`${this.url}`);
    }

    getCategory(category: string) {
        return this.http.get<UserSettings[]>(`${this.url}/${category}`);
    }

    add(userSetting: UserSettings) {
        userSetting.guid = Functions.newGuid();
        return this.http.post(`${this.url}`, userSetting);
    }

    update(userSetting: UserSettings) {
        const guid = userSetting.guid;
        return this.http.put(`${this.url}/${guid}`, userSetting);
    }

    delete(guid: number) {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
