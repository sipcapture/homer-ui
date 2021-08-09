import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionFilterComponent } from './transaction-filter.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
@NgModule({
    imports: [
        CommonModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatExpansionModule,
        MatCheckboxModule,
        FontAwesomeModule,
        MatButtonModule,
        FormsModule
    ],
    declarations: [TransactionFilterComponent],
    exports: [TransactionFilterComponent]
})
export class TransactionFilterModule {
    constructor(library: FaIconLibrary) {
        library.addIconPacks(fas, fab, far);
    }
}
