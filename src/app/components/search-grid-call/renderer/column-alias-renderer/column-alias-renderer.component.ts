import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
interface IP {
    name: string;
    value: string;
    isShorten: boolean;
}
@Component({
    selector: 'app-child-cell',
    templateUrl: './column-alias-renderer.component.html',
    styles: [`
    .alias-field {
        text-overflow:ellipsis;
        overflow:hidden;
        max-width:100%;
    }
    `, `
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

        }`]
})
export class ColumnAliasRenderer implements ICellRendererAngularComp {

    public params: any;
    copyTimer: number;
    selected: boolean;
    timeout;
    ip: IP  = {
        name: '',
        value: '',
        isShorten: false
    };

    async agInit(params: any) {
        this.params = params;
        this.ip = await this.getAlias(params.value);
        if (params.colDef.field === 'source_ip'
            && params.data.aliasSrc
            && !params.data.aliasSrc.includes(params.value)
            && this.ip.name === params.value) {
            this.ip = {
                name: params.data.aliasSrc,
                value: params.value,
                isShorten: false
            };
        } else if (params.colDef.field === 'destination_ip'
                    && params.data.aliasDst
                    && !params.data.aliasDst.includes(params.value)
                    && this.ip.name === params.value) {
            this.ip = {
                name: params.data.aliasDst,
                value: params.value,
                isShorten: false
            };
        }

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
    public ellipsed(txt) {
        return txt?.length > 14 ? txt : txt;
    }
    async getAlias(ip) {
        return await this.params.context.componentParent.getAliasFromIp(ip);
    }
    refresh(): boolean {
        return false;
    }
}
