import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportProtoService {

    private url = `${environment.apiUrl}/export/proto/messages`;

    constructor(private http: HttpClient) { }

    // Return export proto messages
    getMessages(): Observable<any> {
        return this.http.get<any>(this.url);
    }
}
