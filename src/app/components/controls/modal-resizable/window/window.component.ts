import { WindowService } from './window.service';
import {
    EventEmitter,
    Component,
    ViewChild,
    OnDestroy,
    OnInit,
    Output,
    Input,
    ChangeDetectionStrategy,
    ElementRef,
    ChangeDetectorRef,
    SimpleChanges
} from '@angular/core';

@Component({
    selector: 'app-window',
    templateUrl: './window.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowComponent implements OnInit, OnDestroy {
    @ViewChild('content', { static: false }) content: ElementRef<HTMLElement>;

    @Input() width = 700;
    @Input() height = 600;
    @Input() minWidth = 300;
    @Input() minHeight = 300;
    @Input() sharedUrl: string;
    @Input() objectData: any;
    winId: string;
    _isWindow = false;
    watcherInterval;
    get isWindow() {
        return this._isWindow;
    }

    @Input()
    set isWindow(val: boolean) {
        this._isWindow = val;
        if (this._isWindow) {
            this.setWindow();
        }
    }

    @Output() close: EventEmitter<any> = new EventEmitter();

    private externalWindow = null;

    constructor(
        private windowService: WindowService,
        private cdr: ChangeDetectorRef
    ) {
        this.winId = `win-id-${Math.random()}`;
    }
    ngOnChanges(change: SimpleChanges) {
        // console.log(change)
    }
    ngOnInit() {
        if (this._isWindow) {
            this.setWindow();
            this.cdr.detectChanges();
        }
    }
    openWindow() {
        const left = (screen.width - this.width) / 2;
        const top = (screen.height - this.height) / 4;
        console.log(this.sharedUrl)
        return window.open(this.sharedUrl || '', this.winId,
            `toolbar=no,
            location=no,
            directories=no,
            status=no,
            menubar=no,
            scrollbars=no,
            resizable=no,
            copyhistory=no,
            width=${this.width},
            height=${this.height},
            top=${top},
            left=${left}`
        );
    }
    setWindow() {

        this.externalWindow = this.openWindow();
        try {
            this.externalWindow.onbeforeunload = evt => {
                evt.preventDefault();
                evt.returnValue = '';
                setTimeout(() => {

                    this._isWindow = false;
                    this.close.emit({});
                    this.cdr.detectChanges();

                })
            };
        } catch (e) {
            this._isWindow = false;
            this.close.emit({});
            this.cdr.detectChanges();
        }

        if (this.sharedUrl) {
            console.log(this.objectData)
            this.externalWindow['objectData'] = this.objectData;
            this.externalWindow.onload = e => {
                this.externalWindow.onbeforeunload = evt => {
                    evt.preventDefault();
                    evt.returnValue = '';
                    setTimeout(() => {

                        this._isWindow = false;
                        this.close.emit({});
                        this.cdr.detectChanges();

                    })
                };
            };
            this.cdr.detectChanges();
            return;
        }

        const doc = this.externalWindow.document;
        doc.head.innerHTML = window.document.head.innerHTML;
        doc.body.appendChild(this.content.nativeElement);
        doc.body.id = this.winId; // `win-id-${Math.random()}`;

        // add scripts from base project
        Array.from(window.document.body.getElementsByTagName('script')).forEach(s => {
            doc.body.appendChild(s);
        });

        /**
         * add styles
         */

        doc.head.appendChild(this.getStyleSheetElement());

        this.resetStyles(doc);

        const getStyleBuffer = () => Array.from(document.querySelectorAll('style')).map(i => i.innerHTML).join('');
        let styleBuffer = getStyleBuffer();

        doc.body.addEventListener('mousemove', evt => {
            this.windowService.setMousePosition(evt);
        })
        /**
         * realtime watcher for styling changes
        */
        this.watcherInterval = setInterval(() => {
            if (styleBuffer !== getStyleBuffer()) {
                this.resetStyles(doc);
                styleBuffer = getStyleBuffer();
            }
        }, 50);
    }
    private getStyleSheetElement() {
        const styleSheetElement = document.createElement('link');
        document.querySelectorAll('link').forEach(htmlElement => {
            if (htmlElement.rel === 'stylesheet') {
                const absoluteUrl = new URL(htmlElement.href).href;
                styleSheetElement.rel = 'stylesheet';
                styleSheetElement.href = absoluteUrl;
            }
        });
        return styleSheetElement;
    }
    public onFocus() {
        this.externalWindow?.focus();
    }
    private resetStyles(doc) {
        // clear old styles
        doc.querySelectorAll('style').forEach(el => {
            const parent = el.parentElement;
            parent.removeChild(el);
        })

        // Copy styles from parent window
        document.querySelectorAll('style').forEach(htmlElement => {
            doc.head.appendChild(htmlElement.cloneNode(true));
        });
    }

    ngOnDestroy() {
        // console.log(this.winId, 'ngOnDestroy()');
        if (this.externalWindow) {
            this.externalWindow.close();
            this.close.emit({});
            this.cdr.detectChanges();
        }
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
        }
    }
}
