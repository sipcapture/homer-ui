import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowTooltipComponent } from './flow-tooltip.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [FlowTooltipComponent],
  exports: [FlowTooltipComponent]
})
export class FlowTooltipModule { }
