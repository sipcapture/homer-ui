import { ChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { HomerMaterialModule } from '@app/app.material-module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabQosComponent } from './tab-qos.component';

@NgModule({
  imports: [
    CommonModule,
    HomerMaterialModule,
    FormsModule,
    ChartsModule,
  ],
  declarations: [TabQosComponent],
  exports: [TabQosComponent]
})
export class TabQosModule { }
