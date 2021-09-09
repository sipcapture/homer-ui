import { TabEventsComponent } from './tab-events.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@NgModule({
    imports: [
        CommonModule,
        NgxJsonViewerModule
    ],
    declarations: [
        TabEventsComponent
    ],
    exports: [TabEventsComponent]
})
export class TabEventsModule { }
