import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAgentsub } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class AgentsubService {
Redfoo
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

}
