import {
    ComponentFactoryResolver,
    ApplicationRef,
    EventEmitter,
    Component,
    ViewChild,
    OnDestroy,
    Injector,
    OnInit,
    Output,
    Input
} from '@angular/core';
import {CdkPortal, DomPortalHost} from '@angular/cdk/portal';


@Component({
    selector: 'app-window',
    templateUrl: './window.component.html'
})
export class WindowComponent implements OnInit, OnDestroy {
    @ViewChild(CdkPortal, {static: true}) portal: CdkPortal;
    @Input() width = 700;
    @Input() height = 600;
    @Input() minWidth = 300;
    @Input() minHeight = 300;

    _isWindow = false;

    get isWindow () {
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
        private componentFactoryResolver: ComponentFactoryResolver,
        private applicationRef: ApplicationRef,
        private injector: Injector) {}


    ngOnInit() {
        if (this._isWindow) {
            this.setWindow();
        }
    }
    setWindow () {
        const left = (screen.width - this.width) / 2;
        const top = (screen.height - this.height) / 4;

        this.externalWindow = window.open('', '',
            'toolbar=no, location=no, directories=no, ' +
            'status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
            this.width + ', height=' + this.height + ', top=' + top + ', left=' + left);

        try {
            this.externalWindow.onbeforeunload = evt => {
                this._isWindow = false;
                this.close.emit(evt);
            };
        } catch (e) {
            this._isWindow = false;
            this.close.emit(e);
        }

        this.externalOnLoad();
    }
    externalOnLoad () {
        this.externalWindow.document.head.innerHTML = window.document.head.innerHTML;
        this.externalWindow.document.body.innerHTML = '';

        // add scripts from base project
        Array.from(window.document.body.getElementsByTagName('script')).forEach(s => {
            this.externalWindow.document.body.appendChild(s);
        });

        const host = new DomPortalHost(
            this.externalWindow.document.body,
            this.componentFactoryResolver,
            this.applicationRef,
            this.injector
        );

        host.attach(this.portal);
        // this.externalWindow.document.body.style.opacity = '1';
    }
    ngOnDestroy() {
        if (this.externalWindow) {
            this.externalWindow.close();
        }
    }
}