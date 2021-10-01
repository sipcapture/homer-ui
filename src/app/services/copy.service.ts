import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AlertMessage } from '.';

@Injectable({
  providedIn: 'root'
})
export class CopyService {

    private subject = new Subject<any>();
    constructor() { }

    copy(data: any, notification: AlertMessage) {
        this.subject.next({data:data, notification: notification});
    }

    getData(): Observable<any> {
        return this.subject.asObservable();
    }
}
