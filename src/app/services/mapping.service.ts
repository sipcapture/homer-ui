import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceMappingProtocol } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class MappingService {

    private url = `${environment.apiUrl}/mapping`;

    constructor(private http: HttpClient) { }

    // Mapping protokols
    getProtokols(): Observable<PreferenceMappingProtocol> {
        return this.http.get<PreferenceMappingProtocol>(`${this.url}/protocols`);
    }

    // Mapping fields
    getFields(): Observable<PreferenceMappingProtocol> {
        return this.http.get<PreferenceMappingProtocol>(`${this.url}/fields`);
    }

}
