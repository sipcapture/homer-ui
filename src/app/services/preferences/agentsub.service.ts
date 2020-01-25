import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAgentsub } from '@app/models';
import { Functions } from '@app/helpers/functions';

@Injectable({
  providedIn: 'root'
})
export class PreferenceAgentsubService {

  private url = `${environment.apiUrl}/agent/subscribe`;

  constructor(private http: HttpClient) { }

  getAll() {
      return this.http.get<PreferenceAgentsub[]>(`${this.url}`);
  }

  add(ph: PreferenceAgentsub) {
    return 
  }

  update(ph: PreferenceAgentsub) {
      return
  }

  delete(guid: number) {
      return this.http.delete(`${this.url}/${guid}`);
  }

}
