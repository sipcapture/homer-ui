import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class PreferenceVersionService {
    apiUrl = environment.apiUrl;
    constructor(private http: HttpClient) {}
    async getApiVersion() {
        try {
            let data: any = await this.http
                .get(`${this.apiUrl}/version/api/info`)
                .toPromise();
            if (data?.data?.version) {
                return data.data?.version;
            }
            return;
        } catch (err) {
            console.log(err);
            return;
        }
    }
    getUiVersion() {
        return this.http.get(`${this.apiUrl}/version/ui/info`);
    }
}
