import { VistimelineModule } from './../../../controls/vis-components/vistimeline/vistimeline.module';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabTimelineComponent } from './tab-timeline.component';

@NgModule({
  imports: [
    CommonModule,
    VistimelineModule
  ],
  declarations: [TabTimelineComponent],
  exports: [TabTimelineComponent]
})
export class TabTimelineModule { }
