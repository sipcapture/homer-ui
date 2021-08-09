import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VistimelineComponent } from './vistimeline.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [VistimelineComponent],
  exports: [VistimelineComponent],
})
export class VistimelineModule { }
