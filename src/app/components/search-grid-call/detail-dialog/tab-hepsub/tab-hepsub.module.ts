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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MomentPipe } from './moment.pipe';

@NgModule({
  imports: [
    CommonModule,
    MatTabsModule,
    NgxJsonViewerModule,
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
export class TabHepsubModule { }
