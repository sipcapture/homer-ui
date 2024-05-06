import { CommonModule } from '@angular/common';
import {  ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DaterangepickerComponent } from './daterangepicker.component';
import { DaterangepickerDirective } from './daterangepicker.directive';
import { LocaleConfig, LOCALE_CONFIG } from './daterangepicker.config';
import { LocaleService } from './locale.service';
import { TimeZonePipe } from './timezone.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomerMaterialModule } from '@app/app.material-module';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

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
        HomerMaterialModule,
        TranslateModule
    ],
    providers: [],
    exports: [
        DaterangepickerComponent,
        DaterangepickerDirective
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
