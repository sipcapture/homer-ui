import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Injectable, Inject, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService, CopyService } from '@services';
import { TranslateService } from '@ngx-translate/core'
import { ALERT_OVERLAY } from './alert.tokens';
@Component({
    selector: 'alert-overlay',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlertComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    timeoutId: any;
    isOpen = false;
    constructor(
        public translateService: TranslateService,
        private copyService: CopyService,
        @Inject(ALERT_OVERLAY) public message: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }
    @Output() closeAlert = new EventEmitter();
    @Output() clearMessageTimer = new EventEmitter();
    @Output() resetTimer = new EventEmitter();
    ngOnInit() {
    }
    clearMessage() {
        this.closeAlert.emit();
    }
    ngOnDestroy() {
    }
    toggleFull() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.resetTimer.emit();
        } 
    }
    copy() {
        this.translateService.get('notifications.success.notificationCopy').subscribe(alert => {
            this.copyService.copy(this.message.object, alert)
        })
    }
}
