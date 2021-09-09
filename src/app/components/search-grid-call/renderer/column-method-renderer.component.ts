import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `
    <span class='cell-wrapper' [ngClass]="{'selected': selected}" (mousedown)='startCopy()' (mouseup)='copy(method)'>
    
        
        <a (click)="openMethodPopup($event)">{{method}}</a>
    </span>
    `,
    styles: ['a { user-select: text; overflow: hidden; }',`
    ::-moz-selection { 
        background:#20c997;
        color:white; 
    }
    ::selection { 
        background:#20c997;
        color:white;
    }
    .cell-wrapper {
        user-select:contain;
        display: flex; 
        position: absolute; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0;
        align-items: center;
        padding-left: 5px;
        padding-right: 5px;
        line-height:2;
    }
    .selected {
        transition:.3s all;
        background:#20c997;
        color:white;
        border:1px solid white;
        border-radius:3px;

    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnMethodRenderer implements ICellRendererAngularComp {
    public params: any;
    selected
    method: string;
    copyTimer: number;
    agInit(params: any): void {
        this.params = params;
        this.method = this.params.value || null;
    }

    public openMethodPopup(event) {
        event.stopPropagation();
        this.params.context.componentParent.openMethodForSelectedRow(this.params.node.rowIndex, this.params.data, event);
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
