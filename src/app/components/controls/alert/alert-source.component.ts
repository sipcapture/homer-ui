import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from './../../../services';
import { TranslateService } from '@ngx-translate/core'
import { AlertOverlayService } from './alert-overlay.service';
import { AlertOverlayRef } from './alert-ref';



@Component({
    selector: 'alert',
    template: ``,
    styleUrls: ['./alert.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AlertSourceComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    message: any;
    timeoutId: any;
    isOpen = false;
    dialogRef: AlertOverlayRef;
    constructor(
        private alertService: AlertService,
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService,
        private alertOverlay: AlertOverlayService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }
    ngOnInit() {
        this.subscription = this.alertService.getMessage().subscribe(message => {
            if (typeof message === 'undefined' || message.text === '') {
                return;
            }
            this.dialogRef = this.alertOverlay.open({
                message: {
                    text: message.text,
                    object: message.object,
                    type: message.type
                }
            });
            this.isOpen = false;
            this.message = message;
            this.cdr.detectChanges();
        });
    }    
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}