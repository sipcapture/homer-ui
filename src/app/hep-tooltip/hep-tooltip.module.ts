import { NgModule } from '@angular/core';
import { HepTooltipDirective } from '@app/helpers/hep-tooltip.directive';



@NgModule({
  declarations: [HepTooltipDirective],
  exports: [HepTooltipDirective]
})
export class HepTooltipModule { }
