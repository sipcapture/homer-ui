
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core'
@Component({
  selector: 'app-last-error-cell',
  templateUrl: './last-error-cell.component.html',
  styleUrls: ['./last-error-cell.component.scss']
})
export class LastErrorCellComponent implements OnInit {
  @Input() column;
  @ViewChild(MatColumnDef) columnDef: MatColumnDef;

  constructor(public table: MatTable<any>,
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
