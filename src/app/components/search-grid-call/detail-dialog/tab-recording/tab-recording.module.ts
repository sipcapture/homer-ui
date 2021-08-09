import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabRecordingComponent } from './tab-recording.component';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule
  ],
  declarations: [TabRecordingComponent],
  exports: [TabRecordingComponent]
})
export class TabRecordingModule { }
