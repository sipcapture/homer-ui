import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `
        
        <span class='cell-wrapper' (mousedown)='startCopy()' (mouseup)='copy(params.value)'>
            <div class="user-actions">
                <a (click)="openTransactionPopup($event)"
                class="material-icons md-18">open_in_new</a>
            </div>
        </span>
        `,
    styles: [
        `.btn { line-height: 0.5 }`, `.cell-wrapper {
            display: flex; 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0;
            align-items: center;
            padding-left: 5px;
            padding-right: 5px;
            border: 1px solid transparent
        }`
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnActionRenderer implements ICellRendererAngularComp {
    public params: any;
    copyTimer: number;
    agInit(params: any): void {
        this.params = params;
    }

    public openTransactionPopup(event) {
        event.stopPropagation();
        this.params.context.componentParent.openTransactionForSelectedRows(this.params.node.rowIndex, this.params.data)
    }
    startCopy() {
        this.copyTimer = Date.now();
    }
    copy(value) {
        const localTimer = Date.now();
        if (localTimer - this.copyTimer > 700) {
            this.params.context.componentParent.copy(value);
        }
    }
    refresh(): boolean {
        return false;
    }
}
