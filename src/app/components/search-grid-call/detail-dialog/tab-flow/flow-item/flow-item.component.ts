import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-flow-item',
    templateUrl: './flow-item.component.html',
    styleUrls: ['./flow-item.component.scss']
})
export class FlowItemComponent {
    @Input() item: any = {};
    @Input() isSimplify = true;
    @Input() idx = 0;
    @Output() click: EventEmitter<any> = new EventEmitter();

    onClickItem(item, event) {
        this.click.emit({ item, event });
    }
}
