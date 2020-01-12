import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchRemoteService {

    private url = `${environment.apiUrl}/search/remote`;

    constructor(private http: HttpClient) { }

    // Return search remote data
    getData(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/data`, data);
    }

    // Return search remote message
    getMessage(): Observable<any> {
        return this.http.get<any>(`${this.url}/message`);
    }

    // v3/search/remote/label?
    getLabel(server: string): Observable<any> {
        return this.http.get<any>(`${this.url}/label?server=${server}`);
    }

    // v3/search/remote/values?label=method&server=http://127.0.0.1:3100
    getValues(label: string, server: string): Observable<any> {
        return this.http.get<any>(`${this.url}/values?server=${server}&label=${label}`);
    }
}
