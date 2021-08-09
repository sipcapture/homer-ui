import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabGraphComponent } from './tab-graph.component';
import * as vis from 'vis';

declare var vis: any;
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [TabGraphComponent],
  exports: [TabGraphComponent]
})
export class TabGraphModule { }
