import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';

@Component({
    selector: 'app-child-cell',
    template: `
    <span class='cell-wrapper' [ngClass]="{'selected': selected}" (mousedown)='startCopy()' (mouseup)='copy(country)'>
        <mat-icon [matTooltip]='country' style='display: flex; justify-content:center; align-items: center;'> <img [src]='imagepath'></mat-icon>
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
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnCountryRenderer implements ICellRendererAngularComp {
    selected = false;
    public params: any;
    method: string;
    imagepath: string;
    country: string;
    copyTimer: number;
    agInit(params: any): void {
        this.params = params;
        this.country = this.params.value;
        this.imagepath = (this.params.value && this.params.value !== '') ? `assets/flags/${this.params.value}.gif` : null;

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
