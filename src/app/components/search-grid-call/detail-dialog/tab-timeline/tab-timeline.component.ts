import { Component, Input, Output, EventEmitter, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-tab-timeline',
    templateUrl: './tab-timeline.component.html',
    styleUrls: ['./tab-timeline.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class TabTimelineComponent implements AfterViewInit {
    data: any;
    filters: any;
    w100 = 98;
    @Input() set dataItem(_dataItem) {
        this.data = _dataItem;
        this.cdr.detectChanges();
    }
    constructor(private cdr: ChangeDetectorRef) {
    }
    @Output() ready: EventEmitter<any> = new EventEmitter();

    ngAfterViewInit() {
        setTimeout(() => {
            this.ready.emit({});
        }, 35);
    }
    get dWidth(): number {
        this.w100 = (this.w100 + 100) / 2;
        return this.w100; // not freez TimeLine HACK
    }
}
