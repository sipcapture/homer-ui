import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-setting-button',
    templateUrl: './setting-button.component.html',
    styleUrls: ['./setting-button.component.scss']
})
export class SettingButtonComponent implements OnInit {
    @Input() isAccess: any;
    @Output() addDialog: EventEmitter<any> = new EventEmitter();
    @Output() importDialog: EventEmitter<any> = new EventEmitter();
    @Output() exportDialog: EventEmitter<any> = new EventEmitter();
    constructor() { }

    ngOnInit(): void {
    }
}
