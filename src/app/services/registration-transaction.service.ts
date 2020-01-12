import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationTransactionService {

    private url = `${environment.apiUrl}/registration/transaction`;

    constructor(private http: HttpClient) { }

    // return registration transaction
    getRegistrationTransaction(): Observable<any> {
        return this.http.get<any>(this.url);
    }
}
