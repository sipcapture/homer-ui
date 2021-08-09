import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabDtmfComponent } from './tab-dtmf.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HepTooltipModule } from '@app/hep-tooltip/hep-tooltip.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    MatIconModule,
    HepTooltipModule,
    TranslateModule
  ],
  declarations: [
    TabDtmfComponent
  ],
  exports: [TabDtmfComponent]
})
export class TabDtmfModule { }
