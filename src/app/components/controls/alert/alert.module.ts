import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertComponent } from './alert.component';
import { AlertSourceComponent } from './alert-source.component';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateModule } from '@ngx-translate/core';
import {OverlayModule} from '@angular/cdk/overlay';
import { AlertOverlayService } from './alert-overlay.service';
@NgModule({
    imports: [
        CommonModule,
        FontAwesomeModule,
        MatIconModule,
        MatTooltipModule,
        TranslateModule,
        OverlayModule
    ],
    declarations: [AlertComponent, AlertSourceComponent],
    exports: [AlertComponent, AlertSourceComponent],
    entryComponents: [AlertSourceComponent],
    providers: [AlertOverlayService]
})
export class AlertModule {
    constructor(library: FaIconLibrary) {
        library.addIconPacks(fas as any, fab as any, far as any);
    }
}
