import { LokiResultsComponent } from './loki-results.component';
import { CodeStyleFieldModule } from '@widgets/rsearch-widget/code-style-field/code-style-field.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MomentPipe } from './moment.pipe';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    imports: [
        CommonModule,
        CodeStyleFieldModule,
        MatButtonModule,
        MatCheckboxModule,
        FormsModule,
        FontAwesomeModule,
        MatIconModule
    ],
    declarations: [
        LokiResultsComponent,
        MomentPipe
    ],
    exports: [LokiResultsComponent]
})
export class LokiResultsModule {
    constructor(library: FaIconLibrary) {
        library.addIconPacks(fas, fab, far);
    }
 }
