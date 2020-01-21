import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { SearchCallModel } from '../../models/search-call.model';

@Injectable({
  providedIn: 'root'
})
export class SearchCallService {

    private url = `${environment.apiUrl}/search/call`;

    constructor(private http: HttpClient) { }

    // Return search call message
    getMessage(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/message`, data);
    }

    // Return search call data
    getData(searchConfig: SearchCallModel): Observable<any> {
        return this.http.post<any>(`${this.url}/data`, searchConfig);
    }

    // Return search call export data
    getExportData(): Observable<any> {
        return this.http.get<any>(`${this.url}/export/data`);
    }

    getDecodedData(searchConfig: SearchCallModel) {
        return this.http.post<any>(`${this.url}/decode/message`, searchConfig);
    }

}
