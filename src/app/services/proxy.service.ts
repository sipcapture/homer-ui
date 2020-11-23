import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })

export class ProxyService {
  private url = `${environment.apiUrl}/proxy`;

  constructor(private _http: HttpClient) {}
  
  // Get Folders list
  getProxyGrafanaFolders(): Observable<any> {
    return this._http.get<any>(`${this.url}/grafana/folders`);
  }
  getProxyGrafanaSearch(uid: string): Observable<any> {
    return this._http.get<any>(`${this.url}/grafana/search/` + uid);
  }
  // Get Dashboard list
  getProxyGrafanaDashboards(folder: string): Observable<any> {
    return this._http.get<any>(`${this.url}/grafana/dashboards/uid/` + folder);
  }

  // Get Grafana URL
  getProxyGrafanaUrl(): Observable<any> {
    return this._http.get<any>(`${this.url}/grafana/url`);
  }

  // Get Grafana OrgID
  getProxyGrafanaOrg(): Observable<any> {
    return this._http.get<any>(`${this.url}/grafana/org`);
  }

}
