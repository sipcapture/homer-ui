import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { UserSettings } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceUserSettingsService {
    private url = `${environment.apiUrl}/user/settings`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<UserSettings[]>(`${this.url}`);
    }

    add(userSetting: UserSettings) {
        return this.http.post(`${this.url}`, userSetting);
    }

    update(userSetting: UserSettings) {
        const guid = userSetting.guid;
        delete userSetting.guid;
        return this.http.put(`${this.url}/${guid}`, userSetting);
    }

    delete(guid: number) {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
