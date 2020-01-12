import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchRegistrationService {

    private url = `${environment.apiUrl}/search/registration`;

    constructor(private http: HttpClient) { }

    // Return search registration data
    getData(): Observable<any> {
        return this.http.get<any>(`${this.url}/data`);
    }

    // Return search registration message
    getMessage(): Observable<any> {
        return this.http.get<any>(`${this.url}/message`);
    }

}
