import { CommonModule } from '@angular/common';
import {  ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { DaterangepickerComponent } from './daterangepicker.component';
import { DaterangepickerDirective } from './daterangepicker.directive';
import { LocaleConfig, LOCALE_CONFIG } from './daterangepicker.config';
import { LocaleService } from './locale.service';
import { TimeZonePipe } from './timezone.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HepicMaterialModule } from '@app/app.material-module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    DaterangepickerComponent,
    DaterangepickerDirective,
    TimeZonePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    HepicMaterialModule,
    TranslateModule
  ],
  providers: [],
  exports: [
    DaterangepickerComponent,
    DaterangepickerDirective
  ],
  entryComponents: [
    DaterangepickerComponent
  ]
})
export class NgxDaterangepickerMd {
  constructor() {}
  static forRoot(config: LocaleConfig = {}): ModuleWithProviders<NgxDaterangepickerMd> {
    return {
      ngModule: NgxDaterangepickerMd,
      providers: [
        { provide: LOCALE_CONFIG, useValue: config},
        { provide: LocaleService, useClass: LocaleService, deps: [LOCALE_CONFIG]}
      ]
    };
  }
}
