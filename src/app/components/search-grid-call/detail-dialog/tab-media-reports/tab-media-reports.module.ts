// import { BaseChartDirective } from 'ng2-charts';
import { ChartsModule } from 'ng2-charts';
import { CustomTableModule } from '@app/components/controls/custom-table/custom-table.module';
import { ChartBarComponent } from './charts/chart-bar/chart-bar.component';
import { ChartHorizontalBarComponent } from './charts/chart-horizontal-bar/chart-horizontal-bar.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabMediaReportsComponent } from './tab-media-reports.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ColorOffsetModule } from '@app/pipes/colorOffset.module';
@NgModule({
  imports: [
    CommonModule,
    MatRadioModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    MatIconModule,
    CustomTableModule,
    FormsModule,
    ChartsModule,
    ColorOffsetModule
  ],
  declarations: [
    TabMediaReportsComponent,
    ChartHorizontalBarComponent,
    ChartBarComponent
  ],
  exports: [
    TabMediaReportsComponent
  ]
})
export class TabMediaReportsModule { }
