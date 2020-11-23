import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAgentsub } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class AgentsubService {

  private url = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) { }

  // Agentsub protokols
  getProtokols(): Observable<PreferenceAgentsub> {
    return this.http.get<PreferenceAgentsub>(`${this.url}/subscribe`);
  }

  // Agentsub fields
  getFields(): Observable<PreferenceAgentsub> {
    return this.http.get<PreferenceAgentsub>(`${this.url}/fields`);
  }
  /**
   * 
   * 
   */
  getHepsubElements({ uuid, type, data }): Observable<any> {
    return this.http.post<any>(`${this.url}/search/${uuid}/${type}`, data);
  }
  // type = 'cdr' | 'wav' | 'json'
  getType(type: string): Observable<any> {
    return this.http.get<any>(`${this.url}/type/${type}`);
  }

  getHepsubBlobData({ uuid, data }): Observable<any> {
    return this.http.post(`${this.url}/search/${uuid}/download`, data, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    });
  }

}
