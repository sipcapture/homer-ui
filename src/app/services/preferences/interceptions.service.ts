import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceInterception } from '@app/models';
import { Functions } from '@app/helpers/functions';

@Injectable({
  providedIn: 'root'
})
export class PreferenceInterceptionsService {

    private url = `${environment.apiUrl}/interceptions`;

    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<PreferenceInterception[]>(`${this.url}`);
    }

    add(pins: PreferenceInterception) {
        pins.uuid = Functions.newGuid();
        pins.create_date = new Date();
        pins.search_callee = pins.search_callee.toString();
        pins.search_caller = pins.search_caller.toString();
        pins.description = pins.description.toString();
        pins.search_ip = pins.search_ip.toString();
        return this.http.post(`${this.url}`, pins);
    }

    update(pins: PreferenceInterception) {
        pins.modify_date = new Date();
        const uuid = pins.uuid;
        pins.search_callee = pins.search_callee.toString();
        pins.search_caller = pins.search_caller.toString();
        pins.description = pins.description.toString();
        pins.search_ip = pins.search_ip.toString();
        return this.http.put(`${this.url}/${uuid}`, pins);
    }

    delete(uuid: string) {
        return this.http.delete(`${this.url}/${uuid}`);
    }

}
