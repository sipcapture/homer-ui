import {
    Component,
    OnInit,
    ViewChild,
    AfterViewInit,
    Output,
    EventEmitter,
    Input,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    HostListener
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { SmartService } from '@app/services';

@Component({
    selector: 'app-code-style-smart-input-field',
    templateUrl: './code-style-smart-input-field.component.html',
    styleUrls: ['./code-style-smart-input-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeStyleSmartInputFieldComponent implements OnInit, AfterViewInit {
    divHTML: string;
    divText: string;
    serverLoki: string;
    editor: any;
    _queryText = '';

    menuTitle: string;
    isFocusOnField = false;
    private _menuDOM: HTMLElement;
    private lastMenuXPosition = 0;
    @Input() apiLink = '';
    @Input() hepid = 1;
    @Input() set queryText(val: string) {
        if (val === '' && this.editor) {
            this.editor.innerText = '';
        }
        this.setQueryText(val);
    }
    get queryText() {
        return this._queryText;
    }
    @Input() simplefield = false;

    @Output() updateData: EventEmitter<any> = new EventEmitter();
    @Output() keyEnter: EventEmitter<any> = new EventEmitter();
    @ViewChild('divContainer', {static: false}) divContainer;
    @ViewChild(MatMenuTrigger, {static: false}) trigger: MatMenuTrigger;

    popupList: Array<string>;

    constructor(
        private smartService: SmartService,
        private cdr: ChangeDetectorRef
    ) { }
    public setQueryText(value: string) {
        if (this.isFocusOnField && !this.simplefield || this._queryText === value) {
            return;
        }
        this._queryText = value;
        this.editor.innerText = this._queryText;
        this.updateEditor(null);
        this.cdr.detectChanges();
    }
    public getQueryText() {
        return this._queryText;
    }
    ngOnInit() {
    }
    ngAfterViewInit () {
        this.editor = this.divContainer.nativeElement;
        this.editor.onfocus = event => {
            this.isFocusOnField = true;
        };
        this.editor.onfocusout = event => {
            this.isFocusOnField = false;
        };
        this.editor.onkeyup = this.onKeyUpDiv.bind(this);
        this.editor.oninput = (evt: any) => {
            if (evt.inputType === 'deleteContentBackward') {
                evt.preventDefault();
                return;
            }
            this.updateEditor(null);
        };

        if (this._queryText) {
            this.editor.innerText = this._queryText;
            this.updateEditor(null);
        }
        this.cdr.detectChanges();
    }
    @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        if (event.key === 'Enter' && !this.trigger.menuOpen) {
            event.preventDefault();
        }
    }
    async getLabels() {
        try {
            this.menuTitle = 'Labels';
            this.popupList = ['loading...'];
            this.trigger.openMenu();
            this.setMenuXPosition();
            this.editor.focus();

            const labelsData: any = await this.smartService.getLabelByUrl(this.apiLink, this.editor.innerText).toPromise();
            let labels: Array<string> = [];
            if (labelsData && labelsData.data && labelsData.data.length > 0) {
                labels = labelsData.data.map(i => i.value);
            }

            const readyAdded: any = this.getObject(this.editor.innerText);

            this.popupList = labels;


            if ( this.popupList.length > 0) {
                this.trigger.openMenu();
                this.setMenuXPosition();
                this.editor.focus();
            } else {
                this.trigger.closeMenu();
            }
            this.cdr.detectChanges();
        } catch (error) {
            console.error({error});
        }
    }

    private setMenuXPosition() {
        if (this.getCaretPosition() === -1) {
            return;
        }
        if (!this._menuDOM) {
            this._menuDOM = document.querySelector('*[id^=cdk-overlay]');
            setTimeout(() => {
                this._menuDOM.style.marginTop = '-18px';
                this.setMenuXPosition();
            }, 0);
            return;
        }
        const x0 = this._menuDOM.getBoundingClientRect().left - (parseInt(this._menuDOM.style.marginLeft, 10) || 0);

        this._menuDOM.style.marginLeft = (this.getCaretPosition() - x0) + 'px';
    }
    triggerNavMenu(action: string = null) {
        switch (action) {
            case 'ArrowUp': case 'ArrowDown':
                this.trigger.menu.focusFirstItem();
                break;
            case 'Enter':
                event.preventDefault();

                if (!this.trigger.menuOpen) {
                    this.keyEnter.emit();
                }
                break;
        }
    }
    onKeyDownDiv(event) {
        if (!!({ArrowDown: 1, ArrowUp: 1, Enter: 1})[event.key]) {
            this.triggerNavMenu(event.key);
            event.preventDefault();
            this.editor.innerHTML = '' + this.editor.innerText;
            return;
        }
    }
    onKeyUpDiv(event) {
        if (!!{Shift: 1, Control: 1, Alt: 1, Backspace: 1}[event.key]) {
            this.updateEditor(null);
            return;
        }

        if (!!({ArrowDown: 1, ArrowUp: 1, Enter: 1})[event.key]) {
            this.triggerNavMenu(event.key);
            event.preventDefault();
            return;
        }

        if (event.key === '.') {
            this.updateEditor(null);
            this.getLabels();
            if (this.editor) {
                this.editor.focus();
            }
        } else {
            this.trigger.closeMenu();
        }
    }
    private getCaretPosition() {
        try {
            const d = window.getSelection().anchorNode.parentNode as HTMLElement;
            this.lastMenuXPosition = Math.round( d.getBoundingClientRect().left );
            return Math.round( d.getBoundingClientRect().left );
        } catch (e) {
            return -1;
        }
    }
    getObject (str: string) {
        const out = str.split(/\"\s+/g).reduce((a, b) => {
            if (!b.includes('=')) {
                if (b !== '') {
                    a = Object.assign(a, {regexpText: b});
                }
            } else {
                const [key, val] = b.split('=');
                a = Object.assign(a, {[key]: val.replace(/\"/g, '')});
            }
            return a;
        }, {});
        return out;
    }
    getfieldCollectionFromQuery(obj: any) {
        const out: any = Object.entries(obj).map(item => {
            const [name, value] = item;
            return {
                name,
                value,
                type: 'string',
                hepid: this.hepid
            };
        });
        return out;
    }
    getRegExpString(str) {
        return str.split(/\{.*\}\s*/g)[1] || '';
    }
    onMenuMessage (item, event: any = null) {
        if (!event || (event.keyCode === 13 || event.keyCode === 32 )) {
            const str = this.editor.innerText.replace(/[\w\d]*\.\s*$/g, '');
            this.typeInTextarea(str + item + '=', true);
            this.updateEditor(null, true);
        }
        if (event && event.keyCode === 27) {
            this.trigger.closeMenu();
        }
        this.cdr.detectChanges();
    }

    private setStyleCodeColors(str) {
        const s = str.match(/([!@#$%&][\w\d]*[!@#$%&])|([\=\>\<\s]{1,3}[A-Za-z_]+)|(\.[A-Za-z_]+)|([A-Za-z_]+)|(\d+)|([^A-Za-z_])/g);
        if (!s) {
            return '';
        }
        return s.map(i => {
            let cssClass = 'SIwhite';
            if ('{}[]()'.indexOf(i) !== -1) {
                cssClass = 'SIbracket';
            } else if (i.match(/[0-9]+/g)) {
                cssClass = 'SInumber';
            } else if (i.match(/[!@#$%&][\w\d]+[!@#$%&]/g)) {
                cssClass = 'SIequally';
            } else if (i.match(/[\=\>\<]{1,3}\s?[a-zA-Z\d_]+/g)) {
                cssClass = 'SIwhite';
            } else if (i.match(/\.[a-zA-Z_]+/g)) {
                cssClass = 'SIquotes';
            } else if (i.match(/[a-zA-Z_]+/g)) {
                cssClass = 'SIlabel';
            }
            const span: any = document.createElement('span');
            span.contentEditable = 'true';
            span.classList.add(cssClass);
            span.innerText = i;

            return span.outerHTML;
        }).join('');
    }

    private getTextSegments (element) {
        const textSegments = [];
        try {
            Array.from(element.childNodes).forEach((node: Node) => {
                switch (node.nodeType) {
                    case Node.TEXT_NODE:
                        textSegments.push({text: node.nodeValue, node});
                        break;

                    case Node.ELEMENT_NODE:
                        textSegments.splice(textSegments.length, 0, ...(this.getTextSegments(node)));
                        break;

                    default:
                        throw new Error(`Unexpected node type: ${node.nodeType}`);
                }
            });
        } catch (err) { }
        return textSegments;
    }

    private updateEditor(event, setEnd = false) {
        if (!this.editor) {
            return;
        }
        const sel = window.getSelection();
        const textSegments = this.getTextSegments(this.editor);
        const textContent = textSegments.map(({text}) => text).join('');
        let anchorIndex = null;
        let focusIndex = null;
        let currentIndex = 0;
        textSegments.forEach(({text, node}) => {
            if (node === sel.anchorNode) {
                anchorIndex = currentIndex + sel.anchorOffset;
            }
            if (node === sel.focusNode) {
                focusIndex = currentIndex + sel.focusOffset;
            }
            currentIndex += text.length;
        });

        this.editor.innerHTML = this.setStyleCodeColors(textContent);
        if (setEnd) {
            this.restoreSelection(this.editor.innerText.length, this.editor.innerText.length);
        } else {
            this.restoreSelection(anchorIndex, focusIndex);
        }

        this.updateData.emit({
            text: textContent.replace(/\s+/g, ' '),
            serverLoki: this.serverLoki,
            obj: this.getObject(textContent),
            parsedFields: this.getfieldCollectionFromQuery(this.getObject(textContent)),
            rxText: this.getRegExpString(textContent)
        });
    }

    private restoreSelection(absoluteAnchorIndex, absoluteFocusIndex) {
        const sel = window.getSelection();
        const textSegments = this.getTextSegments(this.editor);
        let anchorNode = this.editor;
        let anchorIndex = 0;
        let focusNode = this.editor;
        let focusIndex = 0;
        let currentIndex = 0;

        textSegments.forEach(({text, node}) => {
            const startIndexOfNode = currentIndex;
            const endIndexOfNode = startIndexOfNode + text.length;
            if (startIndexOfNode <= absoluteAnchorIndex && absoluteAnchorIndex <= endIndexOfNode) {
                anchorNode = node;
                anchorIndex = absoluteAnchorIndex - startIndexOfNode;
            }
            if (startIndexOfNode <= absoluteFocusIndex && absoluteFocusIndex <= endIndexOfNode) {
                focusNode = node;
                focusIndex = absoluteFocusIndex - startIndexOfNode;
            }
            currentIndex += text.length;
        });

        try {
            sel.setBaseAndExtent(anchorNode, anchorIndex, focusNode, focusIndex);
        } catch (err) { }
    }
    private typeInTextarea(str, autoClear = false) {
        try {
            const sel: any = window.getSelection();
            const el = this.editor; // sel.anchorNode.parentNode as HTMLElement;
            const start = sel.baseOffset || 1;
            const end = sel.extentOffset || 1;
            const text = el.innerText;
            const before = text.substring(0, start);
            const after  = text.substring(end, text.length);

            if ( autoClear ) {
                el.innerText = str;
            } else {
                el.innerText = before + str + after;
            }
            el.focus();
            return false;
        } catch (_) {
            return false;
        }
        return false;
    }
}
