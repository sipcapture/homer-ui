import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAdvanced } from '@app/models';
import { Functions } from '@app/helpers/functions';

@Injectable({
    providedIn: 'root',
})
export class PreferenceAdvancedService {
    private url = `${environment.apiUrl}/advanced`;

    constructor(
        private http: HttpClient,
        private httpGetBuffer: HttpGetBuffer
    ) { }

    getAll(delayBuffer = 1000 * 30) {
        return this.httpGetBuffer.get<PreferenceAdvanced>(this.url, delayBuffer);
    }

    getSetting(param, category, delayBuffer = 1000 * 30) {
        return this.getAll(delayBuffer)
            .toPromise()
            .then((setting) => {
                if (setting.data) {
                    return setting.data.filter(f => f.param === param && f.category === category).map(m => m.data);
                }
                return;
            });
    }
    getFullSetting(param) {
        return this.getAll()
            .toPromise()
            .then((setting) => {
                if (setting.data) {
                    return setting.data.filter(f => f.param === param);
                }
                return;
            });
    }

    getSettingData(data) {
        if (data) {
            return data[0].data;
        }
        return ['no data received'];
    }

    add(pa: PreferenceAdvanced) {
        pa.guid = Functions.newGuid();
        return this.http.post(`${this.url}`, pa);
    }

    update(pa: PreferenceAdvanced) {
        return this.http.put(`${this.url}/${pa.guid}`, pa);
    }

    delete(guid: string) {
        return this.http.delete(`${this.url}/${guid}`);
    }
}
