import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CallRecordingService {

    private url = `${environment.apiUrl}/call/recording`;

    constructor(private http: HttpClient) { }

    // Return call recording info
    getInfo(): Observable<any> {
        return this.http.get<any>(`${this.url}/info`);
    }

    // Return call recording data
    getData(): Observable<any> {
        return this.http.get<any>(`${this.url}/data`);
    }

    // Return call recording download
    getDownload(): Observable<any> {
        return this.http.get<any>(`${this.url}/download`);
    }


}
