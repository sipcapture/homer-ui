import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAlias } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceAliasService {

    private url = `${environment.apiUrl}/alias`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<PreferenceAlias[]>(`${this.url}`);
    }

    add(pa: PreferenceAlias) {
        pa.captureID = String(pa.captureID);
        return this.http.post(`${this.url}`, pa);
    }

    update(pa: PreferenceAlias) {
        pa.captureID = String(pa.captureID);

        const guid = pa.guid;
        delete pa.guid;
        return this.http.put(`${this.url}/${guid}`, pa);
    }

    delete(guid: string) {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
