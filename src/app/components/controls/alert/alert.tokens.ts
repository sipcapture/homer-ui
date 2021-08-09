import { InjectionToken } from '@angular/core';

import { Message } from './alert-overlay.service';

export const ALERT_OVERLAY = new InjectionToken<Message>('ALERT_OVERLAY');