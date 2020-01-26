import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAuthKey } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceAuthKeyService {

    private url = `${environment.apiUrl}/token/auth`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<PreferenceAuthKey[]>(`${this.url}`);
    }

    add(pa: PreferenceAuthKey) {        
        return this.http.post(`${this.url}`, pa);
    }

    update(pa: PreferenceAuthKey) {
        const guid = pa.guid;
        delete pa.guid;
        return this.http.put(`${this.url}/${guid}`, pa);
    }

    delete(guid: string) {
        return this.http.delete(`${this.url}/${guid}`);
    }

}
