
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core'
@Component({
  selector: 'app-active-cell',
  templateUrl: './active-cell.component.html',
  styleUrls: ['./active-cell.component.scss']
})
export class ActiveCellComponent implements OnInit {
    @Input() column;
    @Input() columnName = 'Status';

    @Input() options: {
        option1: string;
        option2: string;
    };
    @ViewChild(MatColumnDef) columnDef: MatColumnDef;

    constructor(public table: MatTable<any>,  
      private cdr: ChangeDetectorRef,
      public translateService: TranslateService) { 
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
      }
    ngOnInit() {
        if (this.table) {
          this.cdr.detectChanges();
          this.table.addColumnDef(this.columnDef);
        }
      }
}
