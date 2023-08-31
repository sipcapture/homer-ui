import { LokiResultsModule } from '@app/components/controls/loki-results/loki-results.module';
// import { CodeStyleFieldModule } from '@widgets/rsearch-widget/code-style-field/code-style-field.module';
import { TabLogsComponent } from './../tab-logs/tab-logs.component';
// import { TabLokiComponent } from './../tab-loki/tab-loki.component';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabHepsubComponent } from './tab-hepsub.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MomentPipe } from './moment.pipe';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    NgxJsonViewerModule,
    FontAwesomeModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    LokiResultsModule
  ],
  declarations: [
    TabHepsubComponent,
    TabLogsComponent,
    MomentPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [TabHepsubComponent]
})
export class TabHepsubModule {
  constructor(
    library: FaIconLibrary,
    public translateService: TranslateService,
  ) {
    library.addIconPacks(fas as any, fab as any, far as any);
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
  }
}
