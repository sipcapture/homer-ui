import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ProfileStoreService {
    private url = `${environment.apiUrl}/profile/store`;
    constructor(private http: HttpClient) { }

    getStore() {
        return this.http.get<any>(`${this.url}`);
    }


}
