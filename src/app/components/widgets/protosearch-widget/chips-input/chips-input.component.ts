import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';

interface ArrayItem {
    name: string;
}

/**
 * @title Chips with input
 */
@Component({
    selector: 'app-chips-input',
    templateUrl: './chips-input.component.html',
    styleUrls: ['./chips-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipsInputComponent implements OnInit {
    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    arrayValues: ArrayItem[] = [
    ];

    @Input() labelName: string;
    @Input() arrayData: string;
    @Output() arrayDataChange: EventEmitter<string> = new EventEmitter<string>();

    ngOnInit() {

        if (this.arrayData) {
            this.arrayData.split(',').forEach(i => {
                if ((i || '').trim()) {
                    this.arrayValues.push({ name: i.trim() });
                }
            });
        }
    }
    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our item
        if ((value || '').trim()) {
            this.arrayValues.push({ name: value.trim() });
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
        this.update();
    }
    update() {
        this.arrayData = this.arrayValues.map(i => i.name).join();
        this.arrayDataChange.emit(this.arrayData);
    }
    remove(fruit: ArrayItem): void {
        const index = this.arrayValues.indexOf(fruit);

        if (index >= 0) {
            this.arrayValues.splice(index, 1);
        }
        this.update();
    }
}