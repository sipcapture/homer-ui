import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-flow-item',
    templateUrl: './flow-item.component.html',
    styleUrls: ['./flow-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class FlowItemComponent {
    _item: any = {};
    @Input() set item(val: any) {
        this._item = val;
    }
    get item(): any {
        return this._item;
    }
    @Input() isSimplify = true;
    @Input() idx = 0;
    @Output() itemClick: EventEmitter<any> = new EventEmitter();

    onClickItem(idx, event) {
        this.itemClick.emit({ idx, event });
    }
    MOSColorGradient(hue) {
        return Functions.MOSColorGradient(hue * 100, 80, 50);
    }
}
