import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-generic-cell-renderer',
    template: `
    <span class='cell-wrapper'
    [ngClass]="{'selected': selected}" (mousedown)='startCopy()' (mouseup)='copy(value)'>
    
        <span style="overflow: hidden;">{{value}}</span>
    </span>`,
    styles: [`
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
            overflow: hidden;
        }
        .selected {
            transition:.3s all;
            background:#20c997;
            color:white;
            border:1px solid white;
            border-radius:3px;

        }
    `]
})
export class GenericCellRenderer implements ICellRendererAngularComp {
    public params: any;
    selected = false;
    timeout;
    copyTimer: number;
    value;
    
    agInit(params: any): void {
        this.params = params;
        this.value = params.valueFormatted ? params.valueFormatted : params.value;
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
    refresh(): boolean {
        return false;
    }
}
