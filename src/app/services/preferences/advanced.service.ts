import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAdvanced } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceAdvancedService {

    private url = `${environment.apiUrl}/advanced`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<any>(`${this.url}`);
    }

    add(pa: PreferenceAdvanced) {
        return this.http.post(`${this.url}`, pa);
    }

    update(pa: PreferenceAdvanced) {
        return this.http.put(`${this.url}/${pa.guid}`, pa);
    }

    delete(guid: number) {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
