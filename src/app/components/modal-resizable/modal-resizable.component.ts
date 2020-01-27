import { Component, OnInit, ViewChild, Output, EventEmitter, AfterViewInit, Input, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-modal-resizable',
    templateUrl: './modal-resizable.component.html',
    styleUrls: ['./modal-resizable.component.css']
})
export class ModalResizableComponent implements OnInit, AfterViewInit, OnDestroy {
    static ZIndex = 12;
    _content;

    @ViewChild('layerZIndex', {static: false}) layerZIndex;
    @ViewChild('containerWindow', {static: false}) containerWindow;
    @ViewChild('inWindow', {static: false}) inWindow;
    @ViewChild('outWindow', {static: false}) outWindow;

    @Input() title: string;
    @Input() headerColor: string;
    @Input() width = 700;
    @Input() height = 600;
    @Input() minWidth = 300;
    @Input() minHeight = 300;
    @Input() mouseEventData = null;
    @Input() isBrowserWindow = false;
    @Input() startZIndex: number = 0;
    __isBrowserWindow = false;
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() browserWindow: EventEmitter<any> = new EventEmitter();
    isFullPage = false;

    constructor() { }

    ngOnInit() { }

    onFullPage () {
        this.isFullPage = !this.isFullPage;
    }

    ngAfterViewInit() {
        /* attache window to native document.body */
        document.body.appendChild(this.layerZIndex.nativeElement);

        /* clculation max windows size */
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.8;
        this.minWidth = Math.min(this.minWidth, maxWidth);
        this.minHeight = Math.min(this.minWidth, maxHeight);
        (s => {
            s.minWidth = Math.min(maxWidth, Math.max(this.minWidth, this.width)) + 'px';
            s.minHeight = Math.min(maxHeight, Math.max(this.minHeight, this.height)) + 'px';
            s.width = Math.min(this.width, maxWidth) + 'px';
            s.height = Math.min(this.height, maxHeight) + 'px';
        })(this.containerWindow.nativeElement.style);

        if (this.mouseEventData) {
            const mouseOffset = 50; // 50px inside window
            this.setPositionWindow({
                x: this.mouseEventData.clientX - mouseOffset,
                y: this.mouseEventData.clientY - mouseOffset
            });
        }
        this.onFocus();
        if (this.isBrowserWindow) {
            this.newWindow();
        }
    }
    setPositionWindow({x = 0, y = 0}) {
        const el = this.containerWindow.nativeElement;
        const positionLocal = this.getTranslatePosition(el);
        const positionGlobal = el.getBoundingClientRect();
        x = Math.min(window.innerWidth - positionGlobal.width, x);
        y = Math.min(window.innerHeight - positionGlobal.height, y);
        positionLocal.x -= positionGlobal.left;
        positionLocal.y -= positionGlobal.top;
        positionLocal.x = Math.round(positionLocal.x + x);
        positionLocal.y = Math.round(positionLocal.y + y);

        el.style.transform = `translate3d(${positionLocal.x}px, ${positionLocal.y}px, 0px)`;
    }
    onClose () {
        this.close.emit();
    }

    onFocus () {
        this.layerZIndex.nativeElement.style.zIndex = '' + ((ModalResizableComponent.ZIndex += 2) + this.startZIndex);
    }

    onResize(event: any, controlName: string) {
        const x0 = event.clientX;
        const y0 = event.clientY;
        const winWidth = this.containerWindow.nativeElement.offsetWidth;
        const winHeight = this.containerWindow.nativeElement.offsetHeight;
        const winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);

        this.containerWindow.nativeElement.classList.add('animation-off');
        const vector = {
            left:   { h: -1, v:  0 },
            right:  { h:  1, v:  0 },
            bottom: { h:  0, v:  1 },
            top:    { h:  0, v: -1 },
            tl:     { h: -1, v: -1 },
            tr:     { h:  1, v: -1 },
            bl:     { h: -1, v:  1 },
            br:     { h:  1, v:  1 },
        };

        const size = { w: 0, h: 0 },
              vh = vector[controlName].h,
              vv = vector[controlName].v,
              position = {x: winPosition.x, y: winPosition.y};

        window.document.body.onmousemove = evt => {
            if (vh !== 0) {
                const cX = Math.floor(Math[(vh > 0) ? 'max' : 'min'](x0 + vh * (this.minWidth - winWidth), evt.clientX));
                size.w = winWidth + vh * (cX - x0);
                position.x = Math.floor(winPosition.x + (cX - x0) / 2);
                this.containerWindow.nativeElement.style.minWidth = size.w + 'px';
            }
            if (vv !== 0) {
                const cY = Math.floor(Math[(vv > 0) ? 'max' : 'min'](y0 + vv * (this.minHeight - winHeight), evt.clientY));
                size.h = winHeight + vv * (cY - y0);
                position.y = Math.floor(winPosition.y + (cY - y0) / 2);
                this.containerWindow.nativeElement.style.minHeight = size.h + 'px';
            }

            this.containerWindow.nativeElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0px)`;
        };

        window.document.body.onmouseleave = window.document.body.onmouseup = () => {
            this.containerWindow.nativeElement.classList.remove('animation-off');

            window.document.body.onmouseleave = null;
            window.document.body.onmousemove = null;
            window.document.body.onmouseup = null;
        };
    }

    private getTranslatePosition(el): any {
        const style = window.getComputedStyle(el);
        const matrix = new WebKitCSSMatrix(style['webkitTransform']);
        return { x: matrix.m41, y: matrix.m42 };
    }

    onStartMove(event) {
        const x0 = event.clientX;
        const y0 = event.clientY;
        const winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);

        this.containerWindow.nativeElement.classList.add('animation-off');

        window.document.body.onmousemove = evt => {
            const xMove = winPosition.x + (evt.clientX - x0);
            const yMove = winPosition.y + (evt.clientY - y0);
            this.containerWindow.nativeElement.style.transform = `translate3d(${xMove}px, ${yMove}px, 0px)`;
        };

        window.document.body.onmouseleave = window.document.body.onmouseup = () => {
            this.containerWindow.nativeElement.classList.remove('animation-off');

            window.document.body.onmouseleave = null;
            window.document.body.onmousemove = null;
            window.document.body.onmouseup = null;
        };
    }

    onWindowClose (event: any) {
        this._content.appendChild(this.inWindow.nativeElement);
        this.__isBrowserWindow = false;
        this.layerZIndex.nativeElement.style.display = null;
        this.onFocus();
        this.browserWindow.emit(this.__isBrowserWindow);

        this.onClose();
    }

    newWindow () {
        setTimeout(() => {
            this.__isBrowserWindow = true;
            this._content = this.inWindow.nativeElement.parentElement;
            this.outWindow.nativeElement.appendChild(this.inWindow.nativeElement);
            this.layerZIndex.nativeElement.style.display = 'none';
            this.browserWindow.emit(this.__isBrowserWindow);
        });
    }
    ngOnDestroy () {
        document.body.removeChild(this.layerZIndex.nativeElement);
    }
}
