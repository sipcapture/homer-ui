import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyComponent } from './copy.component';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { MatIconModule } from '@angular/material/icon';
import { AlertModule } from '@it-app/components/controls/alert/alert.module';
import { AlertService } from '@it-app/services/alert.service';
import { Router } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        FontAwesomeModule,
        MatIconModule,
        AlertModule
    ],
    declarations: [CopyComponent],
    exports: [CopyComponent],
    providers: [AlertService]
})
export class CopyModule {
    constructor(library: FaIconLibrary) {
        library.addIconPacks(fas as any, fab as any, far as any);
    }
}
