import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmartService {

    // private url = `${environment.apiUrl}/search/remote`;

    constructor(private http: HttpClient) { }

    getLabelByUrl(url: string, text: string = ''): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}${url}?query=${encodeURIComponent(JSON.stringify({data: text}))}`);
    }

    // v3/search/remote/label?
    // getLabel(server: string): Observable<any> {
    //     return this.http.get<any>(`${this.url}/label?server=${server}`);
    // }

    // v3/search/remote/values?label=method&server=http://127.0.0.1:3100
    // getValues(label: string, server: string): Observable<any> {
    //     return this.http.get<any>(`${this.url}/values?server=${server}&label=${label}`);
    // }
}
