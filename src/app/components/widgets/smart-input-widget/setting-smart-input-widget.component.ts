
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { ConstValue } from '@app/models';
import { Functions } from '../../../helpers/functions';


@Component({
    selector: 'app-setting-smart-input-widget-component',
    templateUrl: 'setting-smart-input-widget.component.html',
    styleUrls: ['./setting-smart-input-widget.component.scss']
})

export class SettingSmartInputWidgetComponent implements OnInit, OnDestroy {
    isValidForm = true;
    _interval: any;
    proto: any = {
        hep_alias: '',
        fields_mapping: []
    };
    mappingSortedData: Array<any>;
    resultConfig = {
        title: '',
        isButton: true,
        fields: [],
        profile: '',
        countFieldColumns: 1,
        protocol_id: {
            name: '',
            value: 100
        }
    };

    constructor(
        public dialogRef: MatDialogRef<SettingSmartInputWidgetComponent>,
        public dialogAlarm: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (!data) {
            return;
        }
        try {
            this.resultConfig.title =  data.config.config.title || '';
            this.resultConfig.isButton = data.isButton;
            this.resultConfig.profile = data.config.config.protocol_profile.value;
            this.resultConfig.protocol_id = data.config.config.protocol_id;
            this.mappingSortedData = Functions.cloneObject(data.mapping.data);
            this.mappingSortedData = this.mappingSortedData.filter(
                mapping => mapping.fields_mapping.some(
                    field => field.id === 'smartinput'
                )
            );
            if (data.isContainer) {
                this.mappingSortedData = this.mappingSortedData.filter(item => {
                    return !(item.profile === 'default' && item.hepid === 2000 && item.hep_alias === 'LOKI');
                });
            }
            if (data.config.config.protocol_id) {
                this.proto.hep_alias = data.config.config.protocol_id.name;
                this.proto.profile = this.resultConfig.profile;
            }
         }  catch (err) {
            this.onNoClick();

            this.dialogAlarm.open(DialogAlarmComponent);

            console.warn('ERROR config broken:', err);
        }
    }

    ngOnInit () {
    }
    private getHepId(hep_alias, profile) {
        return this.mappingSortedData.find(i =>
            i.hep_alias === hep_alias &&
            i.profile === profile
        ).hepid;
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
        this._interval = setTimeout(() => {
            if (this.proto) {
                this.resultConfig.protocol_id = {
                    name: this.proto.hep_alias,
                    value: this.getHepId(this.proto.hep_alias, this.proto.profile) || 1
                };
                this.resultConfig.profile = this.proto.profile && this.proto.profile !== '' ?
                    this.proto.profile : this.resultConfig.profile;
            }
        }, 50);
    }
    onUpdateProto(event: any) {
        this.proto.fields_mapping = event;
        this.onChange();
    }
    ngOnDestroy () {
        if (this._interval ) {
            clearInterval(this._interval);
        }
    }
}
