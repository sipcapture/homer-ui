import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TransactionFilterService {
    static subject = new BehaviorSubject<any>({});
    constructor() {
    }
    static get listen(): Observable<any> {
        return this.subject.asObservable();
    }
    static setFilter(filterData) {
        this.subject.next(filterData);
    }
}
