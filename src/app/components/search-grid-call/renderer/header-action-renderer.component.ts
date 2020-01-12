import { Component } from '@angular/core';
import { IHeaderParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { DialogSettingsGridDialog} from '../grid-settings-dialog/grid-settings-dialog';


@Component({
    template: `
        <div class="user-actions">
            <a (click)="onSettingButtonClick()"
                (mouseover)="hover=true"
                (mouseleave)="hover=false"
                class="material-icons md-18"
            >settings_applications</a>
        </div>`,
    styles: [
        `.btn { line-height: 0.5 }`
    ]
})

export class HeaderActionRenderer {
    public params: any;
    constructor(public dialog: MatDialog) {
        console.groupEnd();
        console.log('init header ag-grid');
    }

    agInit(headerParams: IHeaderParams): void {
        console.log({headerParams});
        this.params = headerParams;
    }

    private onSettingButtonClick() {
        this.dialog.open(DialogSettingsGridDialog, {
            width:  '500px', data: {
                apicol: this.params.columnApi,
                apipoint: this.params.api,
                columns: this.params.context.componentParent.columnDefs,
                idParent: this.params.context.componentParent.id
            }
        });
    }
}
