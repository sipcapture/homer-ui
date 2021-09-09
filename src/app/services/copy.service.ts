import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CopyService {

    private subject = new Subject<any>();
    constructor() { }
    
    copy(data: string, notification: string) {
        this.subject.next({data:data, notification: notification});
    }
    
    getData(): Observable<any> {
        return this.subject.asObservable();
    }
}
