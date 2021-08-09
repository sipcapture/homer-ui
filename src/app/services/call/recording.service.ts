import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RecordingService {
    private url = `${environment.apiUrl}/call/recording`;

    constructor(private http: HttpClient) { }
    getData(id) {
        return this.http.get<any>(`${this.url}/data/${id}`);
    }
    postData(request: any) {
        return this.http.post<any>(`${this.url}/data`, request);
    }
    getMp3Link(id): string {
        return `${this.url}/play/${id}`;
    }
    getMp3Data(id): Observable<any> {
        // return this.http.get<any>(`${this.url}/play/${id}`);
        return this.http.post(`${this.url}/play/${id}`, {}, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        });
    }
    getDownloadRtp(type, id): Observable<any> {
        // return this.http.get<any>(`${this.url}/download/${type}/${id}`);
        return this.http.post(`${this.url}/download/${type}/${id}`, {}, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        });
    }
}
