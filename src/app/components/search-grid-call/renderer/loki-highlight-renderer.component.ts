import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    template: `
        <span class='cell-wrapper' (click)='copy(data)'>
            <div class="loki-highlight" [innerHTML]="data"></div>
        </span>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class LokiHighlightRenderer implements ICellRendererAngularComp {
    public params: any;
    data: string;

    agInit(params: any): void {
        this.params = params;
        const rxText = this.params.context.componentParent.searchQueryLoki.rxText;
        if (!!rxText) {
            const regex = new RegExp('(' + rxText + ')', 'g');
            this.data = this.htmlSpecialChars(this.params.value)
                .replace(regex, (g, a) => `<span>${a}</span>`);
        } else {
            this.data = this.htmlSpecialChars(this.params.value || '');
        }
    }
    private htmlSpecialChars(s: string) {
        return s.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');

    }
    
    copy(value) {
        this.params.context.componentParent.copy(value);
    }
    refresh(): boolean {
        return false;
    }
}
