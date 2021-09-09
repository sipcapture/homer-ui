import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { VERSION } from '../../../../VERSION';

@Injectable({
    providedIn: 'root'
})
export class UpdateAlertService {
    private url = `${environment.apiUrl}/version/ui/check/`;

    constructor(private http: HttpClient) { }

    check(): Observable<any> {
        // const testVersion = '9.0.1'; // '10.0.1'
        return this.http.get<any>(`${this.url}${VERSION}`);
    }

}
