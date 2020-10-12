import {Component} from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `<a (click)="openTransactionPopup($event)">{{callid}}</a>`,
    styles: ['a { user-select: text }']
})
export class ColumnCallidRenderer implements ICellRendererAngularComp {
    public params: any;
    callid: string;

    agInit(params: any): void {
        this.params = params;
        this.callid = this.params.value || null;
    }

    public openTransactionPopup(event) {
        this.params.context.componentParent.openTransactionForSelectedRows(this.params.node.rowIndex, this.params.data, event);
    }

    refresh(): boolean {
        return false;
    }
}
