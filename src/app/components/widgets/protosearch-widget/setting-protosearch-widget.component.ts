
import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { AlertService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-setting-protosearch-widget-component',
    templateUrl: 'setting-protosearch-widget.component.html',
    styleUrls: ['./setting-protosearch-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})

export class SettingProtosearchWidgetComponent implements OnInit, OnDestroy {
    isValidForm = true;
    isInvalid: boolean;
    config: any;
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
        private cdr: ChangeDetectorRef,
        public translateService: TranslateService,
        private alertService: AlertService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (!data) {
            return;
        }
        try {
            const { config } = data.config;
            this.config = config;
            this.resultConfig.title = config.title || '';
            this.resultConfig.isButton = data.isButton;
            this.resultConfig.profile = config.protocol_profile.value;
            this.resultConfig.protocol_id = config.protocol_id;
            this.resultConfig.countFieldColumns = data.config.countFieldColumns || 1;
            this.mappingSortedData = Functions.cloneObject(data.mapping);
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
                if (item?.fields_mapping && !item.fields_mapping.find(it => it.id === 'limit')) {
                    item.fields_mapping = item.fields_mapping.concat(this.defaultFields);
                }
            }
            if (config.protocol_id) {
                this.proto.hep_alias = config.protocol_id.name;
                this.proto.profile = this.resultConfig.profile;
                const [defaultMapping] = this.mappingSortedData;
                let mapping = this.mappingSortedData.find(i =>
                    i.hep_alias === config.protocol_id.name &&
                    i.profile === config.protocol_profile.value);

                if (!mapping) {
                    this.proto.hep_alias = defaultMapping.hep_alias;
                    this.proto.profile = defaultMapping.profile;

                    mapping = defaultMapping;
                }
                this.proto.fields_mapping = mapping.fields_mapping.filter(i => !i.skip).map(i => {
                    i.selected = data.config.fields.map(j => j.field_name).includes(i.id);
                    return i;
                });
                this.proto.fields_mapping = this.proto.fields_mapping.filter(i => i.id !== 'smartinput');
            }
            /* sorting this.proto.fields_mapping by data.config.fields */
            const pm = Functions.cloneObject(this.proto.fields_mapping);
            if (pm.length === this.defaultFields.length) {
                const err = 'Please check mappings for this protocol';
                throw err;
            }
            const pmActive = [];
            data.config.fields.forEach(j => {
                const [pmItem] = pm.splice(pm.findIndex(i => i.id === j.field_name), 1);
                pmActive.unshift(pmItem);
            });
            this.proto.fields_mapping = ([].concat(pmActive.reverse(), pm)).filter(i => !!i);
            // this.cdr.detectChanges();
            console.log(this.mappingSortedData)
        } catch (err) {
            this.openDialog();

            console.warn('ERROR config broken:', err, data);
        }
        // this.cdr.detectChanges();
    }
    async openDialog() {
        console.log(this.data.isReset, 'IS RESET')
        const dialogRef = this.dialogAlarm.open(DialogAlarmComponent, {
            data: {
                config: this.config,
                isReset: this.data.isReset,
            }
        });
        const result = await dialogRef.afterClosed().toPromise();
        if (result && result.config && !result.isReset) {
            const config = {
                countFieldColumns: 1,
                fields: result.config.data.fields,
                isButton: true,
                profile: result.config.data.config.protocol_profile.value,
                protocol_id: {
                    name: result.config.data.config.protocol_profile.name,
                    value: result.config.data.config.protocol_profile.value
                },
                title: result.config.data.title,
                isReset: true
            }
            this.dialogRef.close(config);
        }
      
    }
    ngOnInit() {
        this.validate();
        this.cdr.detectChanges();
    }
    private getHepId(hep_alias, profile) {
        return this.mappingSortedData.find(i =>
            i.hep_alias === hep_alias &&
            i.profile === profile
        )?.hepid;
    }
    compareProto(a: any, b: any) {
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

                this.validate();
                this.resultConfig.fields = this.proto.fields_mapping.filter(item => item.selected === true).map(item => {
                    item.proto = this.proto.hep_alias + '-' + this.proto.profile;
                    return item;
                });
                this.cdr.detectChanges();
            }
        }, 50);
    }
    validate() {
        try {
            this.isValidForm = this.proto.fields_mapping.filter(item => item.selected === true).length > 0;
            if (this.isValidForm) {
                this.onChange();
            }
        } catch (err) {
            console.error(10, this.proto.fields_mapping);
        }
        this.cdr.detectChanges();

    }
    validateTitle(event) {
        event = event.trim();
        if (event === '' || event === ' ') {
            this.isInvalid = true;
        } else {
            this.isInvalid = false;
        }
    }
    onUpdateProto(event: any) {
        this.proto.fields_mapping = event;
        this.validate();
        this.onChange();
        this.cdr.detectChanges();
    }
    ngOnDestroy() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }
}
