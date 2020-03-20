import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { ConstValue } from '@app/models';
import { Functions } from '../../../helpers/functions';


@Component({
    selector: 'app-setting-protosearch-widget-component',
    templateUrl: 'setting-protosearch-widget.component.html',
    styleUrls: ['./setting-protosearch-widget.component.css']
})

export class SettingProtosearchWidgetComponent implements OnInit, OnDestroy {
    isValidForm = true;
    _interval: any;
    proto: any = {
        hep_alias: '',
        fields_mapping: []
    };
    fontSize = ''
    mappingSortedData: Array<any>;
    resultConfig = {
        title: '',
        isButton: true,
        fontSize: '1em',
        fields: [],
        profile: '',
        countFieldColumns: 1,
        protocol_id: {
            name: '',
            value: 100
        }
    };

    lokiFields = [{
        id: 'loki',
        name: 'LogQL',
        type: 'string',
        index: 'none',
        form_type: 'loki-field',
        form_default: '',
        disabled: false,
    }];

    defaultFields = [{
        id: ConstValue.LIMIT,
        name: 'Query Limit',
        type: 'integer',
        index: 'none',
        form_type: 'input',
        form_default: '100',
        disabled: false,
    }, {
        id: ConstValue.CONTAINER,
        name: 'Results Container',
        type: 'string',
        index: 'none',
        form_type: 'select',
        form_default: 'default',
        disabled: false,
    }];

    constructor(
        public dialogRef: MatDialogRef<SettingProtosearchWidgetComponent>,
        public dialogAlarm: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            if (!data) {
                return;
            }
            try {
                this.resultConfig.title =  data.config.config.title || '';
                this.resultConfig.isButton = data.isButton;
                this.resultConfig.profile = data.config.config.protocol_profile.value;
                this.resultConfig.protocol_id = data.config.config.protocol_id;
                this.resultConfig.countFieldColumns = data.config.countFieldColumns || 1;
                this.mappingSortedData = Functions.cloneObject(data.mapping.data);
                if (data.isContainer) {
                    this.mappingSortedData = this.mappingSortedData.filter(item => {
                        return !(item.profile === 'default' && item.hepid === 2000 && item.hep_alias === 'LOKI');
                    });
                }
                for (const item of this.mappingSortedData) {
                    if (item.profile === 'default' && item.hepid === 2000 && item.hep_alias === 'LOKI') {
                        item.fields_mapping = this.lokiFields;
                    }

                    /* check if we have default fields inside */
                    if (item.fields_mapping.filter(it => it.id === 'limit').length === 0) {
                        item.fields_mapping = item.fields_mapping.concat(this.defaultFields);
                    }
                }
                if (data.config.config.protocol_id) {
                    this.proto.hep_alias = data.config.config.protocol_id.name;
                    this.proto.profile = this.resultConfig.profile;
                    const mapping = this.mappingSortedData
                        .filter(i => i.hep_alias === data.config.config.protocol_id.name &&
                            i.profile === data.config.config.protocol_profile.value)[0];

                    this.proto.fields_mapping = mapping.fields_mapping.map(i => {
                        i.selected = data.config.fields.map(j => j.field_name).indexOf(i.id) !== -1;
                        return i;
                    });
                }

                this.validate();
            } catch (err) {
                this.onNoClick();

                this.dialogAlarm.open(DialogAlarmComponent);

                console.warn('ERROR config broken');
            }
        }

    ngOnInit () {
        this.validate();
    }
    private getHepId(hep_alias, profile) {
        const mapping = this.mappingSortedData.filter(i => i.hep_alias === hep_alias && i.profile === profile)[0];
        return mapping.hepid;
    }
    compareProto (a: any, b: any) {
        return a.hep_alias === b.hep_alias && a.profile === b.profile;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onChange() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        if(this.fontSize){
            this.resultConfig.fontSize = this.fontSize;
        }
        this._interval = setTimeout(() => {
            if (this.proto) {
                this.resultConfig.protocol_id = {
                    name: this.proto.hep_alias,
                    value: this.getHepId(this.proto.hep_alias, this.proto.profile) || 1
                };
                this.resultConfig.profile = this.proto.profile && this.proto.profile !== '' ?
                    this.proto.profile : this.resultConfig.profile;

                this.validate();
                this.resultConfig.fields = this.proto.fields_mapping.filter(item => item.selected === true).map(item => {
                    item.proto = this.proto.hep_alias + '-' + this.proto.profile;
                    return item;
                });
            }
        }, 50);
    }
    validate() {
        this.isValidForm = this.proto.fields_mapping.filter(item => item.selected === true).length > 0;
        if (this.isValidForm) {
            this.onChange();
        }
    }
    onUpdateProto(event: any) {
        this.proto.fields_mapping = event;
        this.validate();
        this.onChange();
    }
    ngOnDestroy () {
        if (this._interval ) {
            clearInterval(this._interval);
        }
    }
}
