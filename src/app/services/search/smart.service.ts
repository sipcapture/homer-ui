import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmartService {
    constructor(private http: HttpClient) { }

    getLabelByUrl(url: string, text: string = ''): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}${url}?query=${encodeURIComponent(JSON.stringify({data: text}))}`);
    }
}
