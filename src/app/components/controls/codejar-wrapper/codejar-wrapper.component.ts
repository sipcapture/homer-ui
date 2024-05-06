import hljs from 'highlight.js';
import {
    Component, EventEmitter, Input, OnInit, Output, AfterViewInit,
    ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, HostListener
} from '@angular/core';
import { CodeJarContainer } from 'ngx-codejar';

@Component({
    selector: 'app-codejar-wrapper',
    templateUrl: './codejar-wrapper.component.html',
    styleUrls: ['./codejar-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeJarWrapperComponent implements OnInit, AfterViewInit {
    @Input()
    set text(value: string) {
        this.code = value;
        requestAnimationFrame(() => this.cdr.detectChanges());
    }
    get text(): string {
        return this.code;
    }
    @Output() textChange = new EventEmitter<string>();
    @Input() mode: string;
    @Input() jsonValidator: boolean = false;
    @Input() theme = 'monokai';
    _readOnly = false;
    @Input()
    set readOnly(value: boolean) {
        console.log('set readOnly', value, this.editor);
        this._readOnly = value;
        // if (this.editor) {
        //     this.editor.updateOptions({ readOnly: value });
        // }
        if (this.codejar) {
            console.log('set readOnly', this._readOnly, this.codejar);
            this.codejar.nativeElement.querySelector('pre').attributes.contenteditable.value  = !this._readOnly;
        }
    };
    get readOnly(): boolean {
        return this._readOnly;
    }
    @Input() durationBeforeCallback = 0;
    @Input() disabled = false;

    @Output() ready: any = new EventEmitter<string>();
    editor: any;
    code: string = '';
    errorMessage = '';
    isReadyToShow = false;

    @ViewChild('codejar') codejar: any;

    constructor(private cdr: ChangeDetectorRef) {
    }
    @HostListener('document:keydown', ['$event'])
    handleReadOnly(event: KeyboardEvent) {
        return;
        const buttonList = ['Enter', 'Backspace', 'Delete', 'Insert']
        if (this.readOnly && event.key && (event.key.length === 1 || event.ctrlKey || event.shiftKey || buttonList.includes(event.key) )) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    highlightMethodJSON(editor: CodeJarContainer) {
        if (editor.textContent !== null && editor.textContent !== undefined) {
            editor.innerHTML = hljs.highlight(editor.textContent, { language: 'json' }).value;
        }
    }
    highlightMethod(editor: CodeJarContainer) {
        if (editor.textContent !== null && editor.textContent !== undefined) {
            editor.innerHTML = hljs.highlight(editor.textContent, { language: 'javascript' }).value;
        }
    }

    ngAfterViewInit(): void {

        this.editor?.updateOptions({ readOnly: this._readOnly });
        requestAnimationFrame(() => {
            console.log('ngAfterViewInit');
            if (this.codejar) {
                console.log('set readOnly:requestAnimationFrame', this._readOnly, this.codejar);
                this.codejar.nativeElement.querySelector('pre').attributes.contenteditable.value  = !this._readOnly;
            }
        })
    }
    ngOnInit(): void {
    }

    onInit(editor: any) {
        let line = editor.getPosition();
        this.editor = editor;
        this.editor?.updateOptions({ readOnly: this._readOnly });
        console.log(line);
    }
    onChangeCode(event: any) {
        this.code = event;
        if (this.jsonValidator) {
            try {
                JSON.parse(this.code);
                this.errorMessage = '';
            } catch (e) {
                this.errorMessage = e.message;
            }
        }
        requestAnimationFrame(() => this.cdr.detectChanges());
        this.textChange.emit(this.code);
    }
}
