import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertService } from '@app/services';
import { CopyService } from '@app/services/copy.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-copy',
  templateUrl: './copy.component.html',
  styleUrls: ['./copy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyComponent implements OnInit {
    private subscription: Subscription;
    copyData: string;
    notification: string;
    @ViewChild('copyField', { static: false }) copyField: ElementRef;
    constructor(
        private copyService: CopyService,
        private alertService: AlertService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.subscription = this.copyService.getData().subscribe(data => {
            if (typeof data === 'undefined') {
                return;
            }
            this.copyData = data.data;
            this.notification = data.notification;
            this.copy();
        });
    }
    copy() {
        this.cdr.detectChanges()
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.copyData);
            this.alertService.success(this.notification)
        } else {
            this.copyField.nativeElement.focus();
            this.copyField.nativeElement.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.alertService.success(this.notification)
                }
            } catch (err) {
            }
            this.copyField.nativeElement.blur();
        }
    }

}
