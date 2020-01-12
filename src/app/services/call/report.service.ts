import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CallReportService {

    private url = `${environment.apiUrl}/call/report`;

    constructor(private http: HttpClient) { }

    // Return call report log
    getLog(): Observable<any> {
        return this.http.get<any>(`${this.url}/log`);
    }

    // Return call report hepsub
    getHepsub(): Observable<any> {
        return this.http.get<any>(`${this.url}/hepsub`);
    }

    // Return call report rtcp
    getRTCP(): Observable<any> {
        return this.http.get<any>(`${this.url}/rtcp`);
    }

    // Return call report rtc
    getRTC(): Observable<any> {
        return this.http.get<any>(`${this.url}/rtc`);
    }

    // Return call report qos
    getQOS(): Observable<any> {
        return this.http.get<any>(`${this.url}/qos`);
    }

    // Return call report qos
    postQOS(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/qos`, data);
    }

    // Return call report quality
    getQality(): Observable<any> {
        return this.http.get<any>(`${this.url}/quality`);
    }

    // Return call report remote log
    getRemoteLog(): Observable<any> {
        return this.http.get<any>(`${this.url}/remotelog`);
    }


}
