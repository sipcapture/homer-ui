import {Component} from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';



@Component({
    template: `<div class="loki-highlight" [innerHTML]="data"></div>`
})

export class LokiHighlightRenderer implements ICellRendererAngularComp{
    public params: any;
    data: string;

    agInit(params: any): void {
        this.params = params;
        const rxText = this.params.context.componentParent.searchQueryLoki.rxText;

        console.log(rxText, !!rxText);
        if (!!rxText) {

            const regex = new RegExp('(' + rxText + ')', 'g');
            this.data = this.params.value
                .replace(/\</g, '&lt;')
                .replace(/\>/g, '&gt;')
                .replace(regex, (g, a) => {
                    return `<span>${a}</span>`;
                });
        } else {
            this.data = this.params.value || '';
        }
    }
    refresh(): boolean {
        return false;
    }
}
