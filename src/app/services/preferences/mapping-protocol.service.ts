import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceMappingProtocol } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceMappingProtocolService {

  private url = `${environment.apiUrl}/mapping/protocol`;

  constructor(private http: HttpClient) { }

  getAll() {
      return this.http.get<PreferenceMappingProtocol[]>(`${this.url}`);
  }

  add(pmp: PreferenceMappingProtocol) {
      return this.http.post(`${this.url}`, pmp);
  }

  update(pmp: PreferenceMappingProtocol) {
      return this.http.put(`${this.url}/${pmp.guid}`, pmp);
  }

  delete(guid: number) {
      return this.http.delete(`${this.url}/${guid}`);
  }

}
