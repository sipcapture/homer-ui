import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
export interface AlertMessage {
  isTranslation?: boolean;
  message: string;
  fullObject?: string | Object;
  translationParams?: Object;
}
@Injectable({ providedIn: 'root' })
export class AlertService {
  private subject = new Subject<any | null>();
  private keepAfterNavigationChange = false;
  private basePagForRedirectTo = "dashboard/home";
  private baseErrorAfterUnexistingID = "dashboard for the user doesn't exist";
  private waitTimeAfterError = 2000;
  constructor(private router: Router,
    public translateService: TranslateService) {
    // clear alert message on route change
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterNavigationChange) {
          // only keep for a single location change
          this.keepAfterNavigationChange = false;
        } else {
          // clear alert
          this.subject.next(null);
        }
      }
    });
  }


  hide() {
    this.subject.next(null);
  }
  toTypeAlertMessage(message: any) {
    if (typeof message === "string") {
      return <AlertMessage>{
        isTranslation: false,
        message
      }
    }
    return message;
  }
  async success(alert: AlertMessage | any, fullObject: string = '', keepAfterNavigationChange = false) {
    alert = this.toTypeAlertMessage(alert);
    if (alert.isTranslation) {
      alert.message = await this.getTranslation(alert.message, alert.translationParams);
    }
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({ type: 'success', text: alert.message, object: alert.fullObject });
  }

  async error(alert: AlertMessage | any, fullObject: string = '', keepAfterNavigationChange = false) {
    alert = this.toTypeAlertMessage(alert);
    if (alert.isTranslation) {
      alert.message = await this.getTranslation(alert.message, alert.translationParams);
    }
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({ type: 'error', text: alert.message, object: alert.fullObject });
    if (alert.message === this.baseErrorAfterUnexistingID) {
      setTimeout(() => { this.router.navigate([this.basePagForRedirectTo]) }, this.waitTimeAfterError);
    }
  }

  async warning(alert: AlertMessage | any, fullObject: string = '', keepAfterNavigationChange = false) {
    alert = this.toTypeAlertMessage(alert);
    if (alert.isTranslation) {
      alert.message = await this.getTranslation(alert.message, alert.translationParams);
    }
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({ type: 'warning', text: alert.message, object: alert.fullObject });
  }

  async notice(alert: AlertMessage | any, fullObject: string = '', keepAfterNavigationChange = false) {
    alert = this.toTypeAlertMessage(alert);
    if (alert.isTranslation) {
      alert.message = await this.getTranslation(alert.message, alert.translationParams);
    }
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({ type: 'notice', text: alert.message, object: alert.fullObject });
  }
  getTranslation(message: string, translationParams): string {
    this.translateService.get(message, translationParams).subscribe((res: string) => {
      message = res;
    })
    return message;
  }
  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
