import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabSubComponent } from './tab-sub.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@NgModule({
  imports: [
    CommonModule,
    NgxJsonViewerModule
  ],
  declarations: [TabSubComponent],
  exports: [TabSubComponent]
})
export class TabSubModule { }
