import { InjectionToken } from '@angular/core';
import { AlertSubject } from '@app/models/alert.model';


export const ALERT_OVERLAY = new InjectionToken<AlertSubject>('ALERT_OVERLAY');