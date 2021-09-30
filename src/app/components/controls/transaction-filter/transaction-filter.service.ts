import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TransactionFilterService {
    subject = new BehaviorSubject<any>({});
    constructor() {
    }
    get listen(): Observable<any> {
        return this.subject.asObservable();
    }
    setFilter(filterData) {
        this.subject.next(filterData);
    }
}
