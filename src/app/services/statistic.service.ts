import { ErrorHandler, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { catchError } from 'rxjs/operators';

export interface ResyncData {
    node_src:string;
    node_dst:string;
    tables:Array<string>
}

@Injectable({ providedIn: 'root' })

export class StatisticService {
    private url = `${environment.apiUrl}/statistic`;
    private dbUrl = `${environment.apiUrl}/configdb`;
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
    // database statistic and latency info
    getDbStats() {
        return this._http.get(`${this.url}/database/info`);
    }
    getConfigStats() {
        return this._http.get(`${this.url}/configdb/info`).pipe(catchError(this.errorHandler));
    }
    resync(data: any): Observable<any> {
        return this._http.post<any>(`${this.dbUrl}/tables/resync`, data);
    }

    /** error handling method */
    getTableList(): Observable<any> {

        return this._http.get<any>(`${this.dbUrl}/tables/list`)
    }

    errorHandler(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            console.log('An error ocurred: ', error.error.message);
        } else {
            console.log(
                `API returned code ${error.status}, body was: ${error.error}`
            );
        }
        return throwError(
            `Something bad happened, please try again later`
        );
    }



}
