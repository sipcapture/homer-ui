import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchMethodService {

    private url = `${environment.apiUrl}/search/method`;

    constructor(private http: HttpClient) { }

    // Return search method
    getMethod(): Observable<any> {
        return this.http.get<any>(this.url);
    }


}
