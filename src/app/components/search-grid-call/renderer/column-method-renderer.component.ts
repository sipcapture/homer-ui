import {Component} from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `<a (click)="openMethodPopup($event)">{{method}}</a>`,
    styles: ['a { user-select: text }']
})
export class ColumnMethodRenderer implements ICellRendererAngularComp {
    public params: any;
    method: string;

    agInit(params: any): void {
        this.params = params;
        this.method = this.params.value || null;
    }

    public openMethodPopup(event) {
        this.params.context.componentParent.openMethodForSelectedRow(this.params.node.rowIndex, this.params.data, event);
    }

    refresh(): boolean {
        return false;
    }
}
