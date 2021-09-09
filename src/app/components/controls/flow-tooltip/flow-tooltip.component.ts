import { WindowService } from '@app/components/controls/modal-resizable/window/window.service';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { TooltipService } from '@app/services/tooltip.service';
import { style } from '@angular/animations';

@Component({
    selector: 'tooltip',
    templateUrl: './flow-tooltip.component.html',
    styleUrls: ['./flow-tooltip.component.scss'],
    host: { '(document:mousemove)': 'onMouseMove($event)' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowTooltipComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    isMessage: any;
    messageTable: any;
    messageString: string;
    messageChart:  string;
    type = 'string';
    messageBuffer = '';
    point: any = {
        left: 0,
        top: 0
    };
    isLinkImg: boolean;
    @Input() isForPopup = false;
    @ViewChild('tooltipContainer', { static: true }) tooltipContainer: ElementRef;
    constructor(
        private windowService: WindowService,
        private tooltipService: TooltipService,
        private cdr: ChangeDetectorRef
    ) { }

    onMouseMove(evt) {
        const getParentBody = el => {
            if (!el) {
                return { id: '' };
            }
            if (el?.tagName === 'BODY') {
                return el;
            }
            return getParentBody(el.parentElement);
        };

        const parentBody = getParentBody(this.tooltipContainer.nativeElement);
        this.tooltipContainer.nativeElement.style.opacity =
            evt.view?.document?.body?.id === parentBody.id ? (
                this.isForPopup && parentBody.id === '' ? 0 : 1
            ) : 0;
        const tcHeight = this.tooltipContainer.nativeElement.offsetHeight;
        this.point.left = Math.min(evt.clientX + 10, evt.view?.innerWidth - 250);
        this.point.top = Math.min(evt.clientY + 10, evt.view?.innerHeight - tcHeight);
        this.cdr.detectChanges();
    }

    ngOnInit() {
        this.windowService.listen.subscribe(evt => {
            this.onMouseMove(evt);
        })
        this.subscription = this.tooltipService.getMessage().subscribe(message => {
            this.isMessage = Object.keys(message).length !== 0;
            if (typeof message === 'string') {
                this.type = 'string';
            
                this.messageString = message;
                this.cdr.detectChanges();
                return;
            }
            this.type = 'object';
            if (message?.custom === true && this.messageBuffer !== JSON.stringify(message) && this.type !== 'chart') {
                this.messageBuffer = JSON.stringify(message);
                message.custom = null;
                this.messageTable = Object.entries(message).filter(i => !!i[1]).map(i => {
                    const [name, value] = i;
                    return { name, value };
                });
            } else if (message && this.messageBuffer !== JSON.stringify(message)) {
                this.messageBuffer = JSON.stringify(message);

                message = Object.assign({
                    image: null,
                    agent: null,
                    dns: null,
                    alias: null
                }, message); // sort by name
                message.position = null;
                message.hidden = null;
                message.isIPv4 = null;
                message.ip_array = null;
                this.isLinkImg = message.isLinkImg;
                this.messageTable = Object.entries(message).filter(i => !!i[1] && typeof i[1] !== 'object').map(i => {
                    const [name, value] = i;
                    return { name, value };
                });
            }
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
