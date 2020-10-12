import {Component} from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `
        <div class="user-actions">
            <a (click)="openTransactionPopup()"
            class="material-icons md-18">open_in_new</a>
        </div>`,
    styles: [
        `.btn { line-height: 0.5 }`
    ]
})
export class ColumnActionRenderer implements ICellRendererAngularComp {
    public params: any;

    agInit(params: any): void {
        this.params = params;
    }

    public openTransactionPopup() {
        this.params.context.componentParent.openTransactionForSelectedRows(this.params.node.rowIndex, this.params.data)
    }

    refresh(): boolean {
        return false;
    }
}
