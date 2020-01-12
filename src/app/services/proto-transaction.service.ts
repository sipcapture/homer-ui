import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProtoTransactionService {

    private url = `${environment.apiUrl}/proto/transaction`;

    constructor(private http: HttpClient) { }

    // return proto transaction
    getShareLink(): Observable<any> {
        return this.http.get<any>(this.url);
    }
}
