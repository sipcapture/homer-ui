import { WebsharkModule } from './../../controls/webshark/webshark.module';
import { MessageSafeHtmlPipe } from './message-safe-html.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageContentComponent } from './message-content.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertModule } from '@app/components/controls/alert/alert.module';


@NgModule({
    imports: [
        CommonModule,
        MatTabsModule,
        NgxJsonViewerModule,
        MatTableModule,
        WebsharkModule,
        MatIconModule,
        TranslateModule,
        MatTooltipModule,
        AlertModule
    ],
    declarations: [
        MessageContentComponent,
        MessageSafeHtmlPipe
    ],
    exports: [MessageContentComponent]
})
export class MessageContentModule { }
