import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PrometheusService {

    private url = `${environment.apiUrl}/prometheus`;

    constructor(private http: HttpClient) { }

    getLabel(): Observable<any> {
        return this.http.get<any>(`${this.url}/labels`);
    }

    getLabels(id: string): Observable<any> {
        return this.http.get<any>(`${this.url}/label/${id}`);
    }

    getValue(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/value`, data);
    }
}
// /api/v3/prometheus/label/net_contntrack_dialer_conn_failed_total