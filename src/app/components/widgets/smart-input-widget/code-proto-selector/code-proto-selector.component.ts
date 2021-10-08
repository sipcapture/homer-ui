import { Component, Output, EventEmitter, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-code-proto-selector',
    templateUrl: './code-proto-selector.component.html',
    styleUrls: ['./code-proto-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class CodeProtoSelectorComponent {
    protoSelect;
    preProtoSelect;
    protocolList: Array<any> = [];
    @Output() protoChanged: EventEmitter<any> = new EventEmitter();

    @Input()
    set value(val) {
        if (!val || !!this.preProtoSelect) {
            return;
        }
        this.preProtoSelect = val;
        this.protoSelect = this.protocolList.find(({ id }) => id === this.preProtoSelect?.id);
    }

    @Input()
    set mappingList(protocols) {
        if (!protocols) {
            return;
        }
        this.protocolList = protocols.map(({ guid, hep_alias, profile, hepid }) => ({
            id: guid,
            name: `${hep_alias} - ${profile}`,
            value: `${hep_alias} - ${profile}`,
            protocol: profile,
            protocol_id: {
                name: hep_alias,
                value: hepid
            }
        }));


        const [firstChild] = this.protocolList;
        this.protoSelect = this.protocolList.find(({ id }) => id === this.preProtoSelect?.id) || firstChild;

    }

    setValue(val) {
    }
    changeProto($event: Event) {
        this.protoSelect = $event;
        this.protoChanged.emit(this.protoSelect || {});
    }
}
