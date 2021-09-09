import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ClickhouseSerivce {

    private url = `${environment.apiUrl}/clickhouse`;

    constructor(private http: HttpClient) { }

    getRawQuery(data): Observable<any> {
        if (this.sanitize(data)) {
            return this.http.post<any>(`${this.url}/query/raw`, data);
        } else {
            return EMPTY;
        }
    }
    getClickhouseDbList(): Observable<any> {
        const data = {
            query: `SELECT name FROM system.databases ORDER BY name`
        };
        if (this.sanitize(data)) {
            return this.http.post<any>(`${this.url}/query/raw`, data);
        } else {
            return EMPTY;
        }
    }
    getClickhouseTableList(database): Observable<any> {
        const data = {
            query: `SELECT name FROM system.tables WHERE database = '${database}' ORDER BY name`
        };
        if (this.sanitize(data)) {
            return this.http.post<any>(`${this.url}/query/raw`, data);
        } else {
            return EMPTY;
        }
    }
    getClickhouseColumnList(database, table): Observable<any> {
        const data = {
            query: `SELECT name, type FROM system.columns WHERE database = '${database}'
            AND table = '${table}' ORDER BY name`
        };
        if (this.sanitize(data)) {
            return this.http.post<any>(`${this.url}/query/raw`, data);
        } else {
            return EMPTY;
        }
    }
    getClickhouseTimeDate(database, table): Observable<any> {
        const data = {
            query: `SELECT name FROM system.columns WHERE database = '${database}'
            AND table = '${table}' AND type LIKE 'DateTime%' ORDER BY name`
        };
        if (this.sanitize(data)) {
            return this.http.post<any>(`${this.url}/query/raw`, data);
        } else {
            return EMPTY;
        }
    }
    sanitize(data) {
        const regexp = new RegExp(/\bDROP\b|\bINSERT\b|\bCREATE\b|\bALTER\b|\bGRANT\b|\bREVOKE\b|\bDETACH\b|\bKILL\b|\bOPTIMIZE\b|\bSET\b|\bTRUNCATE\b|\bATTACH\b|\bRENAME\b/, 'mi');
        return !regexp.test(data.query);
    }
}