import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceHepsub } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class PreferenceHepsubService {

  private url = `${environment.apiUrl}/hepsub/protocol`;

  constructor(private http: HttpClient) { }

  getAll() {
      return this.http.get<PreferenceHepsub[]>(`${this.url}`);
  }

  add(ph: PreferenceHepsub) {
      return this.http.post(`${this.url}`, ph);
  }

  update(ph: PreferenceHepsub) {
      return this.http.put(`${this.url}/${ph.guid}`, ph);
  }

  delete(guid: number) {
      return this.http.delete(`${this.url}/${guid}`);
  }

}
