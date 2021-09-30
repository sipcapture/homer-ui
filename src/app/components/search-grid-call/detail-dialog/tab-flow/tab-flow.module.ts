import { FlowItemComponent } from './flow-item/flow-item.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabFlowComponent } from './tab-flow.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  imports: [
    CommonModule,
    VirtualScrollerModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule
  ],
  declarations: [
    TabFlowComponent,
    FlowItemComponent,
  ],
  exports: [TabFlowComponent]

})
export class TabFlowModule { }
