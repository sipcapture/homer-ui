import { ChartsModule } from '@xirenec/ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabCallinfoComponent } from './tab-callinfo.component';
import { MatTabsModule } from '@angular/material/tabs';

// import { PreferenceMappingProtocolService } from '@services/preferences/mapping-protocol.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { TranslateModule } from '@ngx-translate/core'
import { HtmlPipe } from './html.pipe';
@NgModule({
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    ChartsModule,
    MatTooltipModule,
    NgxJsonViewerModule,
    FontAwesomeModule,
    TranslateModule
  ],
  declarations: [TabCallinfoComponent, HtmlPipe],
  exports: [TabCallinfoComponent],
})
export class TabCallinfoModule {
  constructor(library: FaIconLibrary) {
      library.addIconPacks(fas as any, fab as any, far as any);
  }
}
