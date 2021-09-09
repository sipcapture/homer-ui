import { FlowItemComponent } from './flow-item/flow-item.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabFlowComponent } from './tab-flow.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
@NgModule({
    imports: [
        CommonModule,
        VirtualScrollerModule,
    ],
    declarations: [
        TabFlowComponent,
        FlowItemComponent,
    ],
    exports: [TabFlowComponent]

})
export class TabFlowModule { }
