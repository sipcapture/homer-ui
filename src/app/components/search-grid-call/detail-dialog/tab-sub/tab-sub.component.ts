import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-tab-sub',
    templateUrl: './tab-sub.component.html',
    styleUrls: ['./tab-sub.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabSubComponent {
    @Input() dataItem: any;
}
