import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';

@Component({
    selector: 'app-generic-cell',
    templateUrl: './generic-cell.component.html',
    styleUrls: ['./generic-cell.component.scss']
})
export class GenericCellComponent implements OnInit {
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
