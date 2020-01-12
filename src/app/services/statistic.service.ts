import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })

export class StatisticService {
    private url = `${environment.apiUrl}/statistic`;

    constructor(private _http: HttpClient) {}

    // Statistic data
    getStatisticData(data: any): Observable<any> {
        return this._http.post<any>(`${this.url}/data`, data);
    }

    // Statistic db list
    getStatisticDbList(): Observable<any> {
        return this._http.get<any>(`${this.url}/_db`);
    }

    // Statistic Retentions
    getStatisticRetentions(data: any): Observable<any> {
        return this._http.post<any>(`${this.url}/_retentions`, data);
    }

    // Statistic Measurements
    getStatisticMeasurements(id: string): Observable<any> {
        return this._http.get<any>(`${this.url}/_measurements/${id}`);
    }

    // Statistic metrics
    getStatisticMetrics(data: any): Observable<any> {
        return this._http.post<any>(`${this.url}/_metrics`, data);
    }

    // Statistic tags
    getStatisticTags(data: any): Observable<any> {
        return this._http.post<any>(`${this.url}/_tags`, data);
    }


}
