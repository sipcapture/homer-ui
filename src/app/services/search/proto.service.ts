import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchProtoService {

    private url = `${environment.apiUrl}/search/proto`;

    constructor(private http: HttpClient) { }

    // Return search proto data
    getData(): Observable<any> {
        return this.http.get<any>(`${this.url}/data`);
    }

    // Return search proto message
    getMessage(): Observable<any> {
        return this.http.get<any>(`${this.url}/message`);
    }

}
