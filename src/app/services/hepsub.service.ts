import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceHepsub } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class HepsubService {

  private url = `${environment.apiUrl}/hepsub`;

  constructor(private http: HttpClient) { }

  // Hepsub protokols
  getProtokols(): Observable<PreferenceHepsub> {
      return this.http.get<PreferenceHepsub>(`${this.url}/protocols`);
  }

  // Hepsub fields
  getFields(): Observable<PreferenceHepsub> {
      return this.http.get<PreferenceHepsub>(`${this.url}/fields`);
  }

}
