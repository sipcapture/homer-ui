import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';

enum Stream {
  rtpagent,
  picserver,
  homerapp
}
export type StreamType = keyof typeof Stream;

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private url = `${environment.apiUrl}/export/action/`;

  constructor(private http: HttpClient) { }

  public getFile() {
    return this.http.get(`${this.url}logs`, {
      responseType: 'blob',
      observe: 'response',
      headers: new HttpHeaders().append('Content-Type', 'application/octect-stream')
    }).toPromise();
  }

  // /export/action/active
  dumpRequest(type: StreamType) {
    return this.http.get(`${this.url}${type}`).toPromise();
  }

  checkIsActive() {
    return this.http.get(`${this.url}active`).toPromise();
  }
}
