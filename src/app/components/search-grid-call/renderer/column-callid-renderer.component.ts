import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `
    <span class='cell-wrapper' [ngClass]="{'selected': selected}" (mousedown)='startCopy()' (mouseup)='copy(params.value)'>
        <a (click)="openTransactionPopup($event)" [matTooltip]='callid' style="overflow: hidden;">{{callid}}</a>
    </span>`,
    styles: ['a { user-select: text; color: inherit; text-decoration: unset; overflow: hidden; }', `
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

    }`],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnCallidRenderer implements ICellRendererAngularComp {
    public params: any;
    callid: string;
    copyTimer: number;
    selected: boolean;
    timeout;
    agInit(params: any): void {
        this.params = params;
        this.callid = this.params.value || null;
    }
    startCopy() {
        this.copyTimer = Date.now();
    }
    copy(value) {
        const localTimer = Date.now();
        if (localTimer - this.copyTimer > 700) {
            this.params.context.componentParent.copy(value);
            this.selected = true;
            this.params.context.componentParent.detectChanges();
            this.timeout = setTimeout(() => {
                this.selected = false;
                this.params.context.componentParent.detectChanges();
            }, 1800);
        }
    }
    public openTransactionPopup(event) {
        // console.log('this.params =>>>>', this.params?.column?.colDef.field);

        event.stopPropagation();
        this.params.context.componentParent
            .openTransactionForSelectedRows(
                this.params.node.rowIndex,
                this.params.data,
                event,
                this.params?.column?.colDef.field
            );
    }

    refresh(): boolean {
        return false;
    }
}
