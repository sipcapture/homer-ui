import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportCallService {

    private url = `${environment.apiUrl}/export/call`;

    constructor(private http: HttpClient) { }

    // get *.pcap format data
    postMessagesPcap(data: any): Observable<any> {
        return this.http.post(`${this.url}/messages/pcap`, data, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        });
    }

    // get *.txt format data
    postMessagesText(data: any): Observable<any> {
        return this.http.post(`${this.url}/messages/text`, data, {
            responseType: 'blob',
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        });
    }

    // Return export call message
    getMessage(): Observable<any> {
        return this.http.get<any>(`${this.url}/message`);
    }

    // Return export call transaction html
    getTransactionHTML(): Observable<any> {
        return this.http.get<any>(`${this.url}/transaction/html`);
    }



}
