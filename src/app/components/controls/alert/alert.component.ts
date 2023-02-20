import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Inject, EventEmitter, Output } from '@angular/core';

import { CopyService, } from './../../../services';
import { TranslateService } from '@ngx-translate/core'
import { ALERT_OVERLAY } from './alert.tokens';
import { Functions } from '@app/helpers/functions';
import { AlertProper, AlertSubject, MessageTimer } from '@app/models/alert.model';


@Component({
    selector: 'alert-overlay',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlertComponent implements OnInit, OnDestroy {
    timeoutId: any;
    isOpen = false;
    messages: Map<string, AlertProper> = new Map();
    guidArray: Array<string> = [];
    constructor(
        public translateService: TranslateService,
        private copyService: CopyService,
        private cdr: ChangeDetectorRef,
        @Inject(ALERT_OVERLAY) public message: AlertSubject
    ) {
        this.addNotification(message, true)
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }
    @Output() closeAlert = new EventEmitter();
    ngOnInit() {
    }
    clearMessage(guid: string) {
        clearTimeout(this.messages.get(guid)?.timeout);
        this.guidArray = this.guidArray.filter(guidFromArray => guidFromArray !== guid);
        this.messages.delete(guid);
        if (this.messages.size === 0) {
            this.closeAlert.emit();
        }
        this.cdr.detectChanges();
    }
    resetTimer(guid: string) {
        clearTimeout(this.messages.get(guid)?.timeout);
    }
    clearMessageTimer(guid: string) {
        const message = this.messages.get(guid);
        if (!message.isOpen) {
            this.resetTimer(guid);
            const message = this.messages.get(guid);
            message.timeout = setTimeout(() => {
                this.clearMessage(guid);
            }, MessageTimer);
            this.messages.set(guid, message);
        }
    }
    ngOnDestroy() {
    }
    toggleFull(guid: string) {
        const message = this.messages.get(guid);
        message.isOpen = !message?.isOpen;
        this.messages.set(guid, message)
        if (message.isOpen) {
            this.resetTimer(guid);
        } 
    }
    addNotification(message: AlertSubject, firstBoot: boolean = false) {
        const guid = Functions.newGuid();
        const timeout = setTimeout(() => {
            this.clearMessage(guid);
        }, MessageTimer);
        const messageProper: AlertProper = {...message, timeout, isOpen: false }
        
        if (this.guidArray.length >= 3) {
            const removedGuid = this.guidArray.shift();
            this.messages.delete(removedGuid);
        }
        this.guidArray.push(guid);
        this.messages.set(guid, messageProper);

        if (!firstBoot) {
            this.cdr.detectChanges();
        }
    }
    copy(guid) {
        const message = this.messages.get(guid);
        this.copyService.copy(message.object, {
            message: 'notifications.success.notificationCopy',
            isTranslation: true,
        });
    }
    returnZero() {
        return 0;
    }
}
