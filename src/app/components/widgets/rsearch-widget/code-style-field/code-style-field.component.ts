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
    OnChanges } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { SearchRemoteService, PreferenceAdvancedService } from '@app/services';

@Component({
    selector: 'app-code-style-field',
    templateUrl: './code-style-field.component.html',
    styleUrls: ['./code-style-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeStyleFieldComponent implements OnInit, AfterViewInit, OnChanges {
    divHTML: string;
    divText: string;
    serverLoki: string;
    lokiTemplate: string;
    editor: HTMLElement;
    isLabel = true;
    _queryText: string;

    lokiConnectionDisapper = false;

    menuTitle: string;
    private _menuDOM: HTMLElement;
    private lastMenuXPosition = 0;

    @Input() set queryText(val) {
        this._queryText = val;
        this.updateEditor();
    }
    get queryText() {
        return this._queryText;
    }
    @Output() updateData: EventEmitter<any> = new EventEmitter();
    @Output() keyEnter: EventEmitter<any> = new EventEmitter();
    @ViewChild('divContainer', {static: false}) divContainer;
    @ViewChild(MatMenuTrigger, {static: false}) trigger: MatMenuTrigger;

    popupList: Array<string>;

    constructor(
        private _pas: PreferenceAdvancedService,
        private _srs: SearchRemoteService,
        private cdr: ChangeDetectorRef
    ) {
        this._pas.getAll().toPromise().then((data: any) => {
            [this.serverLoki] = data.data
                .filter(i => i.category === 'search' && i.param === 'lokiserver')
                .map(i => i.data.host);
            [this.lokiTemplate] = data.data
            .filter(i => i.category === 'search' && i.param === 'lokiserver')
            .map(i => i.data.template);
            this.updateEditor();
            this.cdr.detectChanges();
        });
    }

    ngOnInit() {
    }
    ngOnChanges() {
        if (this.queryText && this.editor !== undefined) {
            this.editor.innerText = this.queryText;
            this.updateEditor();
        }
        this.cdr.detectChanges();
    }
    ngAfterViewInit () {
        this.editor = this.divContainer.nativeElement;
        this.editor.addEventListener('input', this.updateEditor.bind(this));
        if (this.queryText && this.editor !== undefined) {
            this.editor.innerText = this.queryText;
            this.updateEditor();
        }
        this.cdr.detectChanges();
    }
    async getLabels() {
        try {
            this.menuTitle = 'Labels';
            this.popupList = ['loading...'];
            this.trigger.openMenu();
                this.setMenuXPosition();
                this.editor.focus();

            let labels: Array<string> = await this._srs.getLabel(this.serverLoki).toPromise();
            this.isLabel = true;
            if (labels.length === 0) {
                this.lokiConnectionDisapper = true;
                return;
            }
            this.lokiConnectionDisapper = false;

            const readyAdded = this.getObject(this.editor.innerText);

            this.popupList = labels.filter(i => {
                return Object.keys(readyAdded).indexOf(i) === -1;
            });

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
    async getVariabls (label: string = null) {
        label = label || this.editor.innerText.split(',').pop().replace(/[\=\"\,\{\}]+/g, '');
        try {
            setTimeout(() => {
                this.isLabel = false;
                this.popupList = ['loading...'];
                this.menuTitle = `Label value for "${label}"`;
                this.trigger.openMenu();
                this.setMenuXPosition();
                this.editor.focus();
            }, 0);

            this.popupList = await this._srs.getValues(label, this.serverLoki).toPromise();

            this.isLabel = false;
            if ( this.popupList.length > 0) {
                this.menuTitle = `Label value for "${label}"`;
                this.trigger.openMenu();
                this.setMenuXPosition();
                this.editor.focus();
            } else {
                this.trigger.closeMenu();
            }
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
            return;
        }

    }
    onKeyUpDiv(event) {
        // 16 - Shift
        // 13 - Enter
        // 17 - Ctrl
        if (16 === event.keyCode) {
            return;
        }
        if (this.editor.innerText === '' || [17, 16].indexOf(event.keyCode) !== -1) {
            this.trigger.closeMenu();
            return;
        }
        if (!!({ArrowDown: 1, ArrowUp: 1, Enter: 1})[event.key]) {
            this.triggerNavMenu(event.key);
            event.preventDefault();
            return;
        }
        if (['}', ']', ')'].indexOf(event.key) !== -1) {
            if (')}]'.indexOf(this.editor.innerText[0]) !== -1) {
                this.editor.innerText = this.editor.innerText.slice(1);
            }
            if (this.editor.innerText === '') {
                this.trigger.closeMenu();
                return;
            }
            event.preventDefault();
            return false;
        }
        if (['{', '[', '"', "'", ',', '=', '`'].indexOf(event.key) !== -1) {
        // if (['[', '"', ',', '=', '`'].includes(event.key)) {

            const getLastLetter = window.getSelection().anchorNode.textContent.split('')[0];

            if ('(' === getLastLetter) { // ()
                this.editor.innerText = '()';
                this.restoreSelection(1, 1);
                this.updateEditor();
            }
            if ('[' === getLastLetter) { // []
                this.editor.innerText = '[]';
                this.restoreSelection(1, 1);
                this.updateEditor();
            }
            if ('{' === getLastLetter) { // {}
                this.editor.innerText = '{}';
                this.restoreSelection(1, 1);
                this.updateEditor();
            }


            if ('="'.indexOf(getLastLetter) !== -1) { // '=' | '"'
                this.getVariabls();
            } else {
                const o = this.getObject(this.editor.innerText);
                const _label = Object.keys(o).filter(i => o[i] === null);
                if (_label.length > 0) {
                    this.getVariabls(_label[0]);
                } else {
                    this.getLabels();
                }
            }
            this.editor.focus();
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
        if (str.match(/\{.*\}/g)) {
            str = str.match(/\{.*\}/g)[0];
        }
        const json = str.replace(/\{|\}/g, '')
            .split(',')
            .map(i => {
                if (i.indexOf('=') === -1) {
                    i += ':';
                }
            return i;
            }).join(',')
            .replace(/\=/g, ':')
            .replace(/[a-zA-Z-]+/g, (a, b) => `"${a}"`)
            .replace(/\"\"/g, '"')
            .replace(/\s/g, '')
            .replace(/^.*$/g, a => `{${a}}`)
            .replace(',}', '}')
            .replace(':}', ': null}')
            .replace('":"}', '": null}')
            .replace('",: null}', '"}');
            try {
                if (json === '{: null}') {
                    return {};
                }
                return JSON.parse(json);
            } catch (e) {
                return json;
            }
    }
    getRegExpString(str) {
        return str.split(/\{.*\}\s*/g)[1] || '';
    }
    onMenuMessage (item, event: any = null) {
        if (!event || (event.keyCode === 13 || event.keyCode === 32 )) {
            if (this.isLabel ) {
                this.typeInTextarea(item + '=');
                this.updateEditor(null, true);
                const c = this.editor.innerText.length - 1;
                this.restoreSelection(c, c);
                this.getVariabls();
            } else {
                this.typeInTextarea(`"${item}"`);
                this.updateEditor();
                const c = this.editor.innerText.length - 1;
                this.restoreSelection(c, c);
            }
        }
        if (event && event.keyCode === 27) {
            this.trigger.closeMenu();
        }
        this.cdr.detectChanges();
    }

    private setStyleCodeColors(str) {
        const s = str.match(/[\{\}\=, ]{1}|[^\{\}\=, ]+/g);
        if (!s) {
            return '';
        }
        return s.map(i => {
            let cssClass = 'Pwhite';
            if ('{}'.indexOf(i) !== -1) {
                cssClass = 'Pbracket';
            } else if (i === '=') {
                cssClass = 'Pequally';
            } else if (i.match(/[\"\'\`]+/g)) {
                cssClass = 'Pquotes';
            } else if (i.match(/[a-z]+/g)) {
                cssClass = 'Plabel';
            }
            const span = document.createElement('span');
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

    private updateEditor(event = null, setEnd = false) {
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

        try {
            this.editor.innerHTML = this.setStyleCodeColors(textContent); // this.renderText(textContent);
        } catch (err) { }

        if (setEnd) {
            this.restoreSelection(this.editor.innerText.length, this.editor.innerText.length);
        } else {
            this.restoreSelection(anchorIndex, focusIndex);
        }
        if (this.serverLoki) {
            this.updateData.emit({
                text: textContent,
                serverLoki: this.serverLoki,
                template: this.lokiTemplate || '',
                obj: this.getObject(textContent),
                rxText: this.getRegExpString(textContent)
            });
        }
    }

    private restoreSelection(absoluteAnchorIndex, absoluteFocusIndex) {

        // if (!absoluteAnchorIndex || absoluteFocusIndex) {
        //     return;
        // }
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
    private typeInTextarea(str) {
        const sel = window.getSelection() as Selection;
        const el = sel.anchorNode.parentNode as HTMLElement;
        const start = sel['baseOffset'] || 0;
        const end = sel['extentOffset'] || 0;
        const text = el.innerText;
        const before = text.substring(0, start);
        const after  = text.substring(end, text.length);
        el.innerText = (before + str + after);
        el.focus();
        return false;
    }
}
