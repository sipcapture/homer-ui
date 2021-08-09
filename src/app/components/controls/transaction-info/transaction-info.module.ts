import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionInfoComponent } from './transaction-info.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { ColorOffsetModule } from '@app/pipes/colorOffset.module';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
    imports: [
        CommonModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatExpansionModule,
        MatCheckboxModule,
        FontAwesomeModule,
        MatButtonModule,
        MatBadgeModule,
        MatTooltipModule,
        FormsModule,
        ColorOffsetModule,
        TranslateModule
    ],
    declarations: [
        TransactionInfoComponent
    ],
    exports: [TransactionInfoComponent]
})
export class TransactionInfoModule {
    constructor(library: FaIconLibrary) {
        library.addIconPacks(fas, fab, far);
    }
}