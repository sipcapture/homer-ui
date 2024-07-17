import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatColumnDef, MatCellDef, MatTable } from '@angular/material/table';
import  moment from 'moment';
@Component({
  selector: 'app-expire-cell',
  templateUrl: './expire-cell.component.html',
  styleUrls: ['./expire-cell.component.scss'],
})

export class ExpireCellComponent implements OnInit {
  @Input() column;
  @Input() timeFormat;
  @ViewChild(MatColumnDef) columnDef: MatColumnDef;
  @ViewChild(MatCellDef) cellDef: MatCellDef;
  dateFormat;
  constructor(
    public table: MatTable<any>,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {

    if (this.table) {
      this.cdr.detectChanges();
      this.table.addColumnDef(this.columnDef);
    }
  }
 expired(t) {
      const now = moment().unix();
      const record =  moment(t).unix();
     if(now && record){
     return now > record
    } else { return false }
  }

  formatDate(item) {
    return moment(item).format(this.timeFormat);
  }
}
