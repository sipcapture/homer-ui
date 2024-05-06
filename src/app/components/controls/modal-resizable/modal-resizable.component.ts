import {
    AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
    HostListener, Input,
    OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { emitWindowResize } from '@app/helpers/windowFunctions';
import { WindowService } from '@app/services/window.service';
import moment from 'moment';
import { MessageDetailsService } from '../../../services/message-details.service';
import { ModalCoordinates, defaultX, defaultY, TouchPosition, WinPositon, WinSize } from './modal-resizable.model';
import { IS_DIFF, ModalService } from './modal.service';

@Component({
    selector: 'app-modal-resizable',
    templateUrl: './modal-resizable.component.html',
    styleUrls: ['./modal-resizable.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalResizableComponent implements OnInit, AfterViewInit, OnDestroy {
    static ZIndex = 12;
    _content;
    _arrowMetaData: any = null;
    _noLayout = false;
    _isNonWindow: boolean = false;
    @ViewChild('layerZIndex', { static: false }) layerZIndex;
    @ViewChild('containerWindow', { static: false }) containerWindow;
    @ViewChild('inWindow', { static: false }) inWindow;
    @ViewChild('nativeWindow', { static: false }) nativeWindow;
    @ViewChild('outWindow', { static: false }) outWindow;
    @Input()
    set isNonWindow(bool: boolean) {
        this._isNonWindow = bool;
    }
    get isNonWindow(): boolean {
        return this._isNonWindow;
    }
    _sharedUrl: string;
    @Input() set sharedUrl(val: string) {
        this._sharedUrl = val;
        this.cdr.detectChanges();
    };
    get sharedUrl(): string {
        return this._sharedUrl
    }
    _objectData: any;
    @Input() set objectData(val: any) {
        this._objectData = val;
        this.cdr.detectChanges();
    };
    get objectData(): any {
        return this._objectData;
    };

    _title: string;
    @Input() set title(val: string) {
        this._title = val;
        requestAnimationFrame(() => {
            this.onFocus();
        })
    }
    get title(): string {
        return this._title;
    };

    _title2: string;
    @Input() set title2(val: string) {
        this._title2 = val;
        requestAnimationFrame(() => {
            this.onFocus();
        })
    }
    get title2(): string {
        return this._title2;
    };
    @Input() id: string;
    @Input() set headerColor(val: string) {
        this._headerColor = val;
        this.cdr.detectChanges();
    };
    get headerColor(): string {
        return this._headerColor;
    }
    _headerColor;
    @Input() width = 700;
    @Input() height = 600;
    @Input() minWidth = 300;
    @Input() minHeight = 300;
    @Input() mouseEventData = null;
    @Input() isBrowserWindow = false;
    @Input() startZIndex = 0;
    @Input() isOutsideButton = false;
    @Input() isRefreshButton = false;
    _isRefreshing = false;
    @Input() set isRefreshing(val: boolean) {
        this._isRefreshing = val;
        this.cdr.detectChanges();
    }
    get isRefreshing(): boolean {
        return this._isRefreshing;
    }
    @Input() isLoaded = false;
    @Input() isDiffEvent = false;
    @Input() isDiffDoubleEvent = false;

    @Input() set arrowMetaData(val: any) {
        this._arrowMetaData = val;
    }
    get arrowMetaData(): any {
        return this._arrowMetaData;
    }
    escTimeout: any;
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() browserWindow: EventEmitter<any> = new EventEmitter();
    @Output() refreshButton: EventEmitter<any> = new EventEmitter();
    @Output() diff: EventEmitter<any> = new EventEmitter();
    _coordinates: ModalCoordinates = {
        x: defaultX,
        y: defaultY,
        width: 0,
        height: 0,
        isFullPage: false
    }
    @Input() set coordinates(val: ModalCoordinates) {
        if (typeof this._coordinates === 'undefined' || (this._coordinates.x === defaultX && this._coordinates.y === defaultY)) {
            this.setModalPosition(val.x, val.y);
            this.mouseEventData = undefined;
        } else {
            this.coordinatesChange.emit(val)
        }
        this._coordinates = val;
    }
    get coordinates(): ModalCoordinates {
        return this._coordinates;
    }
    @Output() coordinatesChange: EventEmitter<ModalCoordinates> = new EventEmitter()
    __isBrowserWindow = false;
    @Input() isFullPage = false;
    isDropLayer = false;
    isDropRight = false;
    isDropLeft = false;
    touchPosition: TouchPosition = null;
    winPosition: WinPositon = null;
    winSize: WinSize = null;
    isOpacity = false;
    coordinatesTimeout: any;
    constructor(
        private messageDetailsService: MessageDetailsService,
        private cdr: ChangeDetectorRef,
        private windowService: WindowService,
        private modalService: ModalService
    ) {
        this.cdr.detach();
    }

    ngOnInit() {
        if (this.isDiffDoubleEvent) {
            this.id = IS_DIFF;
        }
        this.windowService.windowList.set(this.id, moment().unix())
        this.cdr.detectChanges();
    }

    onFullPage(fullPage?: boolean) {
        this.isFullPage = typeof fullPage === 'boolean' ? fullPage : !this.isFullPage;
        this.coordinates.isFullPage = this.isFullPage;
        this.coordinatesChange.emit(this.coordinates);
        setTimeout(() => {
            emitWindowResize();
            this.cdr.detectChanges();
        }, 35);
    }

    @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.onClose();
    }

    diffLayerOff() {
        this.isDropRight = false;
        this.isDropLeft = false;
    }

    @HostListener("document:mousemove", ["$event"])
    async onDragOver(evt) {
        const m = this.modalService;

        if (this.isDragging && this.isOpacity !== m.getOpacity) {
            this.isOpacity = m.getOpacity;
            this.cdr.detectChanges();
        }

        if (this.isDragging || evt.buttons === 0) {
            if (this.isDropLayer !== false) {
                this.isDropLayer = false;
                this.diffLayerOff();
                m.setDropLayer(false, this.id, null, this.isDropLeft, this.isDropRight);
                evt.preventDefault();
                this.cdr.detectChanges();
            }
            return;
        }
        if (!m.isDragging()) {
            return;
        }
        if (!(this.isDiffEvent || this.isDiffDoubleEvent)) {
            return;
        }
        evt.preventDefault();
        const { x, y, w, h } = this.getTranslatePosition(this.containerWindow.nativeElement, false);
        const { pageX: X, pageY: Y } = evt;

        // console.log('onDragOver::ID', this.id);
        if (
            x <= X && x + w >= X &&
            y <= Y && y + h >= Y
        ) {
            if (this.isDiffDoubleEvent) {
                const ll = X - x;
                const rr = (x + w) - X;
                this.isDropRight = rr < ll;
                this.isDropLeft = rr > ll;
                // console.log({ rr, ll });
            }
            if (this.isDiffDoubleEvent || this.isDropLayer !== true) {
                m.setDropLayer(true, this.id, this._zindex, this.isDropLeft, this.isDropRight);
                this.isDropLayer = m.checkZIndex(this.id);
                if (!this.isDropLayer) {
                    m.setDropLayer(false, this.id, null, this.isDropLeft, this.isDropRight);
                    this.diffLayerOff();
                }

            } else if (this.isDropLayer && !m.checkZIndex(this.id)) {
                this.isDropLayer = false;
                m.setDropLayer(false, this.id, null, this.isDropLeft, this.isDropRight);
                m.checkZIndex(this.id);
                this.diffLayerOff();
            }
        } else {
            if (this.isDropLayer !== false) {
                m.setDropLayer(false, this.id, null, this.isDropLeft, this.isDropRight);
                this.isDropLayer = m.checkZIndex(this.id);
            }
            this.diffLayerOff();
            m.removeActive(this.id);
        }
        this.cdr.detectChanges();
    }

    ngAfterViewInit() {
        /* attache window to native document.body */
        document.body.appendChild(this.layerZIndex.nativeElement);
        const { min, max, ceil } = Math;
        /* calculation max windows size */
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.8;
        this.minWidth = ceil(min(this.minWidth, maxWidth));
        this.minHeight = ceil(min(this.minHeight, maxHeight));
        (s => {
            s.minWidth = ceil(min(maxWidth, max(this.minWidth, this.width))) + 'px';
            s.minHeight = ceil(min(maxHeight, max(this.minHeight, this.height))) + 'px';
            s.width = ceil(min(this.width, maxWidth)) + 'px';
            s.height = ceil(min(this.height, maxHeight)) + 'px';
        })(this.containerWindow.nativeElement.style);

        if (this.mouseEventData) {
            const mouseOffset = 50; // 50px inside window
            this.setPositionWindow({
                x: ceil(this.mouseEventData.clientX - mouseOffset),
                y: ceil(this.mouseEventData.clientY - mouseOffset)
            });
            this.mouseEventData.focus = () => this.onFocus();
        }
        this.onFocus(true);
        if (this.isBrowserWindow) {
            this.newWindow();
        }
    }
    setPositionWindow({ x = 0, y = 0 }) {
        const { min, ceil } = Math;
        const el = this.containerWindow.nativeElement;
        const positionLocal = this.getTranslatePosition(el);
        const positionGlobal = el.getBoundingClientRect();
        x = ceil(min(window.innerWidth - positionGlobal.width, x));
        y = ceil(min(window.innerHeight - positionGlobal.height, y));
        positionLocal.x -= positionGlobal.left;
        positionLocal.y -= positionGlobal.top;
        positionLocal.x = ceil(positionLocal.x + x);
        positionLocal.y = ceil(positionLocal.y + y);
        this.setModalPosition(positionLocal.x, positionLocal.y)
    }
    onClose() {
        if (this.id === this.windowService.currentWindow) {
            this.windowService.close(this.id)
            this.close.emit({});
            this.cdr.detectChanges();
        }
    }
    onFocus(isInit = false) {
        if (this.windowService.currentWindow !== this.id || isInit) {
            this.windowService.currentWindow = this.id;
            this.windowService.windowList.set(this.id, moment().unix());
            this.layerZIndex.nativeElement.style.zIndex = '' + ((ModalResizableComponent.ZIndex += 2) + this.startZIndex);
            this.nativeWindow.onFocus();
            this.cdr.detectChanges();
        }
    }
    get _zindex() {
        return +this.layerZIndex.nativeElement.style.zIndex
    }
    onResize(event: any, controlName: string) {
        const { min, ceil } = Math;
        this._noLayout = false;
        this.setMouseLayer(true);
        const x0 = ceil(event.clientX);
        const y0 = ceil(event.clientY);
        const winWidth = ceil(this.containerWindow.nativeElement.offsetWidth);
        const winHeight = ceil(this.containerWindow.nativeElement.offsetHeight);
        const winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);

        this.containerWindow.nativeElement.classList.add('animation-off');
        const vector = {
            left: { h: -1, v: 0 },
            right: { h: 1, v: 0 },
            bottom: { h: 0, v: 1 },
            top: { h: 0, v: -1 },
            tl: { h: -1, v: -1 },
            tr: { h: 1, v: -1 },
            bl: { h: -1, v: 1 },
            br: { h: 1, v: 1 },
        };

        const size = { w: 0, h: 0 },
            vh = vector[controlName].h,
            vv = vector[controlName].v,
            position = { x: winPosition.x, y: winPosition.y };

        // window.document.body.classList.add('no-selected-text');
        window.document.body.onmousemove = evt => {
            if (vh !== 0) {
                const cX = ceil(Math[(vh > 0) ? 'max' : 'min'](x0 + vh * (this.minWidth - winWidth), evt.clientX));
                size.w = ceil(winWidth + vh * (cX - x0));
                position.x = ceil(winPosition.x + (cX - x0) / 2);
                this.containerWindow.nativeElement.style.minWidth = size.w + 'px';
            }
            if (vv !== 0) {
                const cY = ceil(Math[(vv > 0) ? 'max' : 'min'](y0 + vv * (this.minHeight - winHeight + 200) , evt.clientY));
                size.h = ceil(winHeight + vv * (cY - y0));
                position.y = ceil(winPosition.y + (cY - y0) / 2);
                this.containerWindow.nativeElement.style.minHeight = size.h + 'px';
            }

            this.setModalPosition(position.x, position.y)

            emitWindowResize();
        };

        window.document.body.onmouseleave = window.document.body.onmouseup = () => {
            this.containerWindow.nativeElement.classList.remove('animation-off');
            this.setMouseLayer(false);
            emitWindowResize();
            setTimeout(() => {

                const winWidth = ceil(this.containerWindow.nativeElement.offsetWidth);
                const winHeight = ceil(this.containerWindow.nativeElement.offsetHeight);
                this.coordinates.height = winHeight;
                this.coordinates.width = winWidth;
                this.coordinates.x = position.x;
                this.coordinates.y = position.y;
                this.coordinatesChange.emit(this.coordinates);
            }, 10);
            window.document.body.onmouseleave = null;
            window.document.body.onmousemove = null;
            window.document.body.onmouseup = null;
        };
    }
    onResizeTouch(event: TouchEvent, controlName: string) {
        event.preventDefault()
        const { min, ceil } = Math;
        this._noLayout = false;
        this.setMouseLayer(true);
        if (this.touchPosition === null) {
            this.touchPosition = {
                x: ceil(event.targetTouches[0].clientX),
                y: ceil(event.targetTouches[0].clientY)
            }
        }
        if (this.winPosition === null) {
            this.winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);
            this.winPosition.h = ceil(this.containerWindow.nativeElement.offsetHeight);
        }
        if (this.winSize === null) {
            this.winSize = {
                width: ceil(this.containerWindow.nativeElement.offsetWidth),
                height: ceil(this.containerWindow.nativeElement.offsetHeight)
            }
        }
        this.containerWindow.nativeElement.classList.add('animation-off');
        const vector = {
            left: { h: -1, v: 0 },
            right: { h: 1, v: 0 },
            bottom: { h: 0, v: 1 },
            top: { h: 0, v: -1 },
            tl: { h: -1, v: -1 },
            tr: { h: 1, v: -1 },
            bl: { h: -1, v: 1 },
            br: { h: 1, v: 1 },
        };

        const size = { w: 0, h: 0 },
            vh = vector[controlName].h,
            vv = vector[controlName].v,
            position = { x: this.winPosition.x, y: this.winPosition.y };
        if (vh !== 0) {
            const cX = ceil(Math[(vh > 0) ? 'max' : 'min'](this.touchPosition.x + vh * (this.minWidth - this.winSize.width), event.targetTouches[0].clientX));
            size.w = ceil(this.winSize.width + vh * (cX - this.touchPosition.x));
            position.x = ceil(this.winPosition.x + (cX - this.touchPosition.x) / 2);
            this.containerWindow.nativeElement.style.minWidth = size.w + 'px';
        }
        if (vv !== 0) {
            const cY = ceil(Math[(vv > 0) ? 'max' : 'min'](this.touchPosition.y + vv * (this.minHeight - this.winSize.height), event.targetTouches[0].clientY));
            size.h = ceil(this.winSize.height + vv * (cY - this.touchPosition.y));
            position.y = ceil(this.winPosition.y + (cY - this.touchPosition.y) / 2);
            this.containerWindow.nativeElement.style.minHeight = size.h + 'px';
        }

        this.setModalPosition(position.x, position.y)

        emitWindowResize();
    }
    afterResize() {
        this._noLayout = true;
        emitWindowResize();
    }

    private getTranslatePosition(el, isFromCenterOfScreen = true): any {
        const { ceil } = Math;
        const style = window.getComputedStyle(el);
        const matrix = new WebKitCSSMatrix(style['webkitTransform']);
        const { offsetWidth: winWidth, offsetHeight: winHeight } = el;
        const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
        if (isFromCenterOfScreen) {
            return {
                x: ceil(matrix.m41),
                y: ceil(matrix.m42),
                w: ceil(winWidth),
                h: ceil(winHeight)
            };
        } else {
            return {
                x: ceil(matrix.m41 + ((screenWidth - winWidth) / 2)),
                y: ceil(matrix.m42 + ((screenHeight - winHeight) / 2)),
                w: ceil(winWidth),
                h: ceil(winHeight)
            };
        }
    }

    onStartMove(event) {
        const { max, ceil } = Math;
        const x0 = ceil(event.clientX);
        const y0 = ceil(event.clientY);
        const winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);;

        const documentHeight = ceil(max(window.innerHeight, document.body.offsetHeight));
        const top0px = ceil((documentHeight - winPosition.h) / -2);

        this.containerWindow.nativeElement.classList.add('animation-off');
        this.layerZIndex.nativeElement.classList.add('active');

        window.document.body.onmousemove = evt => {
            this.setMouseLayer(true);
            const xMove = ceil(winPosition.x + (evt.clientX - x0));
            const yMove = ceil(max(top0px, winPosition.y + (evt.clientY - y0)));
            this.setModalPosition(xMove, yMove)
            if (this.coordinatesTimeout) {
                clearTimeout(this.coordinatesTimeout);
            }
            this.coordinatesTimeout = setTimeout(() => {
                this.coordinates.x = xMove;
                this.coordinates.y = yMove
            }, 20);
        };

        window.document.body.onmouseleave = window.document.body.onmouseup = () => {
            this.containerWindow.nativeElement.classList.remove('animation-off');
            this.layerZIndex.nativeElement.classList.remove('active');
            this.setMouseLayer(false);
            window.document.body.onmouseleave = null;
            window.document.body.onmousemove = null;
            window.document.body.onmouseup = null;
        };
    }
    setModalPosition(xMove: number, yMove: number) {
        this.containerWindow.nativeElement.style.transform = `translate3d(${xMove}px, ${yMove}px, 0px)`;
    }
    onStartMoveTouch(event: TouchEvent) {
        const { max, ceil } = Math;
        if (this.touchPosition === null) {
            this.touchPosition = {
                x: ceil(event.targetTouches[0].clientX),
                y: ceil(event.targetTouches[0].clientY)
            }
        }
        if (this.winPosition === null) {
            this.winPosition = this.getTranslatePosition(this.containerWindow.nativeElement);
            this.winPosition.h = ceil(this.containerWindow.nativeElement.offsetHeight);
        }
        const documentHeight = ceil(max(window.innerHeight, document.body.offsetHeight));
        const top0px = ceil((documentHeight - this.winPosition.h) / -2);
        this.containerWindow.nativeElement.classList.add('animation-off');
        this.layerZIndex.nativeElement.classList.add('active');
        this.setMouseLayer(true);
        const xMove = ceil(this.winPosition.x + (event.targetTouches[0].clientX - this.touchPosition.x));
        const yMove = ceil(Math.max(top0px, this.winPosition.y + (event.targetTouches[0].clientY - this.touchPosition.y)));
        this.setModalPosition(xMove, yMove)
    }
    resetTouch() {
        this.containerWindow.nativeElement.classList.remove('animation-off');
        this.layerZIndex.nativeElement.classList.remove('active');
        this.setMouseLayer(false);
        this.touchPosition = null;
        this.winPosition = null;
        this.winSize = null;
    }
    onWindowClose(event: any) {
        this._content.appendChild(this.inWindow.nativeElement);
        this.browserWindow.emit(false);
        setTimeout(() => {
            this.onClose();
            this.cdr.detectChanges();
        }, 5);
    }
    isDragging = false;
    setMouseLayer(bool: boolean = true) {
        this.isDragging = bool;
        if (bool) {
            this.modalService.setDraggingId(this.id);
        } else {
            const pairOfDiff: any[] = this.modalService.getPair();
            if (pairOfDiff?.length >= 2 && this.id) {
                // console.log('getPair emitted from id', this.id);
                this.diff.emit(pairOfDiff)
            }
            this.modalService.removeDraggingId();
        }
        this.cdr.detectChanges();
        let _layer: any = document.querySelector('.mouse-layer');
        if (!_layer) {
            _layer = document.createElement('div');
            _layer.classList.add('mouse-layer');
            document.body.appendChild(_layer);
        }
        _layer.style.display = bool && !this._noLayout ? 'block' : 'none';

    }
    newWindow() {
        this.__isBrowserWindow = true;
        this._content = this.inWindow.nativeElement.parentElement;
        this.outWindow.nativeElement.appendChild(this.inWindow.nativeElement);
        this.layerZIndex.nativeElement.style.display = 'none';
        this.browserWindow.emit(this.__isBrowserWindow);
        this.cdr.detectChanges();
    }
    clickArrowLeft(event: any = null): void {
        event.stopPropagation();
        this.messageDetailsService.clickArrowLeft({
            data: this.arrowMetaData,
            mouseEventData: event
        });
    }
    clickArrowRight(event: any = null): void {
        event.stopPropagation();
        this.messageDetailsService.clickArrowRight({
            data: this.arrowMetaData,
            mouseEventData: event
        });
    }
    ngOnDestroy() {
        document.body.removeChild(this.layerZIndex.nativeElement);
        clearTimeout(this.escTimeout);
        clearTimeout(this.coordinatesTimeout);
        this.windowService.close(this.id);
    }
    onWheel($event) {
        return;
    }
    refresh(e: MouseEvent) {
        e.stopPropagation();
        this.coordinatesChange.emit(this.coordinates);
        this.refreshButton.emit(true);
    }
    setHeight(height){
        this.height = height + 45; // 45 - is header
        this.ngAfterViewInit();
        this.cdr.detectChanges();
    }
}
