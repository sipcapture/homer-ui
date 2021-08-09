import { MatPaginatorModule } from '@angular/material/paginator';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabTdrComponent } from './tab-tdr.component';
import { CustomTableModule } from '@app/components/controls/custom-table/custom-table.module';
import { AgGridModule } from 'ag-grid-angular';
import { CustomAgGridModule } from '@app/components/controls/custom-ag-grid/custom-ag-grid.module';
@NgModule({
  imports: [
    CommonModule,
    CustomTableModule,
    AgGridModule.withComponents([]),
    MatPaginatorModule,
    CustomAgGridModule
  ],
  declarations: [TabTdrComponent],
  exports: [TabTdrComponent]
})
export class TabTdrModule { }
