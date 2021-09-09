import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

export type FileType = 'Pcap' | 'SIPP' | 'Text' | 'Report';

@Injectable({
    providedIn: 'root'
})
export class ExportCallService {

    private url = `${environment.apiUrl}/export/call`;

    constructor(private http: HttpClient) { }

    postMessagesFile(data: any, type: FileType): Promise<any> {
        const folder = type === 'Report' ? '/transaction/' : '/messages/';
        return this.http.post(this.url + folder + type.toLowerCase(), data, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        }).toPromise();
    }

    getPCAPSuleFile(data: any): Promise<any> {
        const folder = '/stenographer';
        return this.http.post(this.url + folder , data, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        }).toPromise();
    }

    // Return export call message
    getMessage(): Observable<any> {
        return this.http.get<any>(`${this.url}/message`);
    }

    // Return export call transaction html
    getTransactionHTML(): Observable<any> {
        return this.http.get<any>(`${this.url}/transaction/html`);
    }
    postShareLink(data: any): Observable<any> {
        return this.http.post(`${this.url}/transaction/link`, data, {
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        });

    }

}
