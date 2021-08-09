import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core'
@Component({
  selector: 'app-data-cell',
  templateUrl: './data-cell.component.html',
  styleUrls: ['./data-cell.component.scss']
})
export class DataCellComponent implements OnInit {
    @Output() settingDialog: EventEmitter<any> = new EventEmitter();
    @Input() column;
    @ViewChild(MatColumnDef) columnDef: MatColumnDef;

    constructor(
      public table: MatTable<any>,  
      private cdr: ChangeDetectorRef,
      public translateService: TranslateService
      ) {
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
