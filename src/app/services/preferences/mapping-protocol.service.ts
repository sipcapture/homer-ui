import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceMapping } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferenceMappingProtocolService {

    private url = `${environment.apiUrl}/mapping/protocol`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<PreferenceMapping[]>(`${this.url}`);
    }
    /**
     * Key: 'TableMappingSchema.Version' Error:Field validation for 'Version' failed on the 'required' tag"
     */
    add(pmp: PreferenceMapping) {
        pmp.guid = Functions.newGuid();
        pmp.version = 1;
        return this.http.post(`${this.url}`, pmp);
    }

    update(pmp: PreferenceMapping) {
        return this.http.put(`${this.url}/${pmp.guid}`, pmp);
    }

    delete(guid: number) {
        return this.http.delete(`${this.url}/${guid}`);
    }

    getListByUrl(urlList: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}${urlList}`);
    }

}
