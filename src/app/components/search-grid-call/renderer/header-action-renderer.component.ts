import { Component } from '@angular/core';
import { IHeaderParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { DialogSettingsGridDialog} from '../grid-settings-dialog/grid-settings-dialog';


@Component({
    template: `
        <div class="user-actions">
            <a (click)="onChackAllClick()"
                class="material-icons md-18"
            >done_outline</a>
        </div>`,
    styles: [
        `.btn { line-height: 0.5 }`
    ]
})

export class HeaderActionRenderer {
    public params: any;
    constructor(public dialog: MatDialog) {
        console.groupEnd();
    }

    agInit(headerParams: IHeaderParams): void {
        this.params = headerParams;
    }

    onChackAllClick() {
        let i = 0;
        let bool = true;
        while (this.params.api.getRowNode(i) !== undefined && bool) {
            bool = bool && this.params.api.getRowNode(i).selected;
            i++;
        }
        if (!bool) {
            this.params.api.selectAll();
        } else {
            this.params.api.deselectAll();
        }
        
    }
}
