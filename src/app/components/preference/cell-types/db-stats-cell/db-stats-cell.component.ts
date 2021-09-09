import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';

@Component({
  selector: 'app-db-stats-cell',
  templateUrl: './db-stats-cell.component.html',
  styleUrls: ['./db-stats-cell.component.scss']
})
export class DbStatsCellComponent implements OnInit {
    @Input() column;
    @ViewChild(MatColumnDef) columnDef: MatColumnDef;

    constructor(public table: MatTable<any>,  private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        if (this.table) {
          this.cdr.detectChanges();
          this.table.addColumnDef(this.columnDef);
        }
      }

}
