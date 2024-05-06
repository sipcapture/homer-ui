import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HepLogService {
  private url = `${environment.apiUrl}/call/report/log`;

  constructor(private http: HttpClient) { }

  getLog(data: any) {
    return this.http.post<any>(`${this.url}`, data);
  }
}


// /**
//  * TODO:
//  * transaction dialog / logs / HEPSUB:"test-endpoint"/ cdr
//  * as on HOMER [domain:port-1]/dashboard/home
//  * [domain:port-2]/api/v3/agent/type/cdr
//  */
