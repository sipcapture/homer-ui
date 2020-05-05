import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from '@app/services';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.scss']
})

export class AlertComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    message: any;
    timeoutId: any;
    constructor(private alertService: AlertService) { }

    ngOnInit() {
        this.subscription = this.alertService.getMessage().subscribe(message => {
            this.message = message;
            this.clearMessageTimer();
        });
    }
    clearMessageTimer(){
        this.resetTimer();
        this.timeoutId =   setTimeout(() => {
                this.message = null;
            }, 5000);
    }
    clearMessage(){
        this.resetTimer();
        this.message = null;
    }
    resetTimer(){
        clearTimeout(this.timeoutId);
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}