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
import { Subscription } from 'rxjs';
import { CallCaptureIdConsolidationService } from '@app/services/call/consolidation.service';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: ['./flow-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemComponent implements AfterViewChecked {
  _item: any = {};
  showSubItems: boolean = false;

  consolidationFilterSubscription: Subscription;
  expandedItemSubscription: Subscription;

  @Input() set item(val: any) {
    this._item = val;
    this.mergeOptions();
  }
  get item(): any {
    return this._item;
  }
  @Input() isSimplify = true;
  @Input() isGroupByAlias = false;
  @Input() idx = 0;
  @Input() isAbsolute: boolean = false;
  @Output() itemClick: EventEmitter<{ idx: number, event: any, item: any }> = new EventEmitter();

  constructor(
    private cdr: ChangeDetectorRef, 
    private consolidationService: CallCaptureIdConsolidationService) {}

  ngOnInit() {
    this.expandedItemSubscription = this.consolidationService.expandedItem$.subscribe(expandedIdx => {
      if (expandedIdx !== this.idx && this.showSubItems) {
        this.showSubItems = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestory() {
    if (this.consolidationFilterSubscription) this.consolidationFilterSubscription.unsubscribe();
    if (this.expandedItemSubscription) this.expandedItemSubscription.unsubscribe();
  }

  onClickItem(item, idx, event) {
    this.itemClick.emit({ idx, event, item });
  }

  toggleSubItems(event: Event) {
    event.stopPropagation(); // Prevent triggering the onClickItem event
    this.showSubItems = !this.showSubItems;
    if (this.showSubItems) {
      this.consolidationService.setExpandedItem(this.idx);
    }    
  }

  MOSColorGradient(hue) {
    return Functions.MOSColorGradient(hue * 100, 80, 50);
  }

  private mergeOptions() {
    if (this._item && this._item.subItems) {
      this._item.subItems = this._item.subItems.map((subItem, iter) => ({
        ...subItem,
        options: this._item.options,
        __item__subindex__: iter
      }));
    }
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }
}
