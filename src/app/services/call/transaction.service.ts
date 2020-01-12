import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CallTransactionService {

    private url = `${environment.apiUrl}/call`;

    constructor(private http: HttpClient) { }

    // return call transaction
    getTransaction(data: any): Observable<any> {
        return this.http.post<any>(`${this.url}/transaction`, data);
    }
}
