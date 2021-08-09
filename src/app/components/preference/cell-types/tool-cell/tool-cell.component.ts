import { ChangeDetectorRef, Component, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { MatColumnDef, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-tool-cell',
  templateUrl: './tool-cell.component.html',
  styleUrls: ['./tool-cell.component.scss']
})
export class ToolCellComponent implements OnInit {
    @Input() column;
    @Input() isAccess;
    @Input() page;
    @ViewChild(MatColumnDef) columnDef: MatColumnDef;
    @Output() settingDialog: EventEmitter<any> = new EventEmitter();
    @Output() resyncDialog: EventEmitter<any> = new EventEmitter();
    @Output() resetDialog: EventEmitter<any> = new EventEmitter();
    @Output() deleteDialog: EventEmitter<any> = new EventEmitter();
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

    childCount(div) {
        return div.childElementCount;
    }
}
