import { Functions } from '@app/helpers/functions';
import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, HostListener, Input,
    ChangeDetectionStrategy, 
    ChangeDetectorRef} from '@angular/core';

import * as moment from 'moment';
@Component({
    selector: 'full-screen',
    templateUrl: './full-screen.component.html',
    styleUrls: ['./full-screen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullScreenComponent implements OnInit {
    @ViewChild('fileSelect', { static: true }) fileSelect;
    isFullPage = false;
    isDragOver = false;
    @ViewChild('innerContainer') innerContainer: ElementRef<HTMLElement>;
    @ViewChild('content') content: ElementRef<HTMLElement>;
    @Output() fullPage: EventEmitter<any> = new EventEmitter();
    @Output() import: EventEmitter<any> = new EventEmitter();
    @Input() data: any;
    constructor(
        private cdr: ChangeDetectorRef) { }

    ngOnInit() {
    }
    ngAfterViewInit() {
        const hsp = e => {
            this.isDragOver = e.type === 'dragover';
            e.preventDefault();
            e.stopPropagation();
            this.cdr.detectChanges();
        };
        const handlerDrop = e => {
            hsp(e);
            Array.from(e.dataTransfer.files).forEach(this.upload.bind(this));
        };
        const objEvents = {
            submit: hsp, drag: hsp, dragstart: hsp, dragend: hsp,
            dragover: hsp, dragenter: hsp, dragleave: hsp,
            drop: handlerDrop, change: e => this.upload(e.target.files[0])
        };
        Object.keys(objEvents).forEach(eventName => {
            this.fileSelect.nativeElement.addEventListener(eventName, objEvents[eventName]);
        });
    }
    @HostListener('document:keydown.escape', ['$event']) onEscapeHandler(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isFullPage = false;
        this.innerContainer.nativeElement.appendChild(this.content.nativeElement);
        Functions.emitWindowResize();
        this.fullPage.emit(this.isFullPage);
    }
    onFullPage() {
        this.isFullPage = !this.isFullPage;
        const ne = this.content.nativeElement;
        if (this.isFullPage) {
            document.body.appendChild(ne);
            ne?.querySelector('ace-editor')
                ?.querySelector('textarea')?.focus();
        } else {
            this.innerContainer.nativeElement.appendChild(ne);
        }
        Functions.emitWindowResize();
        this.fullPage.emit(this.isFullPage);
    }
    download() {
        Functions.saveToFile(this.data.json, `${this.data.title} ${moment().format('YYYY-MM-DD HH:mm:ss')}.${this.data.type}`);
    }
    async upload(file) {
        if (!this.data) {
            this.data = {};
        }
        const text = await file.text();
        this.import.emit(text);
    }
}
