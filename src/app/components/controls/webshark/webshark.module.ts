import { MatTooltipModule } from '@angular/material/tooltip';
import { WebsharkDictionary } from './webshark-dictionary';
import { HtmlPipe } from './html.pipe';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsharkComponent } from './webshark.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomTableModule } from '../custom-table/custom-table.module';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
@NgModule({
    imports: [
        CommonModule,
        NgxJsonViewerModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        CustomTableModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule
    ],
    declarations: [
        HtmlPipe,
        WebsharkDictionary,
        WebsharkComponent
    ],
    exports: [WebsharkComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WebsharkModule { }
