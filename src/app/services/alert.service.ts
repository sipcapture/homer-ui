import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private subject = new Subject<any>();
    private keepAfterNavigationChange = false;
    private basePagForRedirectTo = "dashboard/home";
    private baseErrorAfterUnexistingID = "dashboard for the user doesn't exist";
    private waitTimeAfterError = 2000;
    constructor(private router: Router) {
        // clear alert message on route change
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterNavigationChange) {
                    // only keep for a single location change
                    this.keepAfterNavigationChange = false;
                } else {
                    // clear alert
                  this.subject.next({} as any);
                }
            }
        });
    }


    hide () {
      this.subject.next({});
    }

    success(message: string, fullObject: string = '', keepAfterNavigationChange = false) {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({ type: 'success', text: message, object: fullObject });
    }

    error(message: string, fullObject: string = '', keepAfterNavigationChange = false) {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({ type: 'error', text: message, object: fullObject });
        if(message === this.baseErrorAfterUnexistingID){
            setTimeout(() => { this.router.navigate([this.basePagForRedirectTo]) },this.waitTimeAfterError);
        }


    }

    warning(message: string, fullObject: string = '', keepAfterNavigationChange = false) {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({ type: 'warning', text: message, object: fullObject });
    }

    notice(message: string, fullObject: string = '', keepAfterNavigationChange = false) {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({ type: 'notice', text: message, object: fullObject });
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}
