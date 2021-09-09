import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomAgGridModule } from '@app/components/controls/custom-ag-grid/custom-ag-grid.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabMessagesComponent } from './tab-messages.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
@NgModule({
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
    MatSortModule,
    CustomAgGridModule,
    MatIconModule,
    MatButtonModule
  ],
  declarations: [TabMessagesComponent],
  exports: [TabMessagesComponent]
})
export class TabMessagesModule { }
