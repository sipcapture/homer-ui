import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShareLinkService {

    private url = `${environment.apiUrl}/share/link`;

    constructor(private http: HttpClient) { }

    // Return share link
    getShareLink(): Observable<any> {
        return this.http.get<any>(this.url);
    }


}
