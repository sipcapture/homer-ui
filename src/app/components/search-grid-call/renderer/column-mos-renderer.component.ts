import { Component, ChangeDetectionStrategy } from '@angular/core';
import {ICellRendererAngularComp} from 'ag-grid-angular';
import { Functions } from '@app/helpers/functions';
@Component({
    selector: 'app-child-cell',
    template: `
    <span class='cell-wrapper' (mousedown)='startCopy()' (mouseup)='copy(params.value)'>
        <div [ngClass]="{'mos-cell': !isEmpty}" [style.color]='mosColor'>
            <div>{{params.value / 100}}</div>
        </div>
    </span>
    `,
    styles: [`.mos-cell {
        display:flex;
        align-items:center;
        justify-content:center;
        width:30px;
        height:30px;
        background-color: hsla(180, 100%, 10%, 0.4);
        border-radius: 3px;
        overflow: hidden;
    }`,`
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

        }`],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnMOSRenderer implements ICellRendererAngularComp {
    // backup for circle in mos
    public params: any;
    method: string;
    mos: any;
    mosColor: string;
    isEmpty: boolean;
    displayedValue: any;
    copyTimer: number;
    agInit(params: any): void {
        this.params = params;
        this.isEmpty = this.params.value === 0 || this.params.value === '';
        this.displayedValue = this.isEmpty ? this.params.value : '';
        this.mos = this.params.value ? this.params.value : '';
        if (this.mos !== '') {
            this.mosColor = Functions.MOSColorGradient(this.mos, 100, 60);
        } else {
            this.mosColor = 'transparent';
        }
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
