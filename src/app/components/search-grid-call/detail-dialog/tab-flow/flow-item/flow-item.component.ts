import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { Functions } from '@app/helpers/functions';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: ['./flow-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemComponent implements AfterViewChecked {
  // _item: any = {};
  // @Input() set item(val: any) {
  //   this._item = val;
  // }
  // get item(): any {
  //   return this._item;
  // }
  @Input() txItem: any = {};
  @Input() isSimplify = true;
  @Input() isGroupByAlias = false;
  @Input() txidx = 0;
  @Input() isAbsolute: boolean = false;
  @Output() itemClick: EventEmitter<any> = new EventEmitter();
  @Output() clickItemShow: EventEmitter<any> = new EventEmitter();
  callData: Array<any>;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    console.log(this.txidx)
    this.initData();
  }

  initData () {
    this.callData = this.txItem ? this.txItem.call_data : [];
  }

  onClickItem(idx, event, item) {
    this.itemClick.emit({ idx, event, item });
  }

  onClickItemShow() {
    this.clickItemShow.emit({idx: this.txidx});
  }

  MOSColorGradient(hue) {
    return Functions.MOSColorGradient(hue * 100, 80, 50);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }
}
