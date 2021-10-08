import { FormControl } from '@angular/forms';

import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogAlarmComponent } from '../dialog-alarm/dialog-alarm.component';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-setting-smart-input-widget-component',
  templateUrl: 'setting-smart-input-widget.component.html',
  styleUrls: ['./setting-smart-input-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingSmartInputWidgetComponent implements OnInit, OnDestroy {
  isValidForm = true;
  isInvalid: boolean;
  _interval: any;
  proto: any = {
    hep_alias: '',
    fields_mapping: [],
    shown: true
  };
  targetResultsContainerValue = new FormControl();
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

  field_targetResultsContainer: any;
  field_limit: any;

  constructor(
    public dialogRef: MatDialogRef<SettingSmartInputWidgetComponent>,
    public dialogAlarm: MatDialog,
    public translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
    if (!data) {
      return;
    }

    console.log({ data: this.data });

    try {
      const { config } = data.config;
      this.resultConfig.title = config.title || '';
      this.resultConfig.isButton = config.searchbutton;
      this.resultConfig.profile = config.protocol_profile.value;
      this.resultConfig.protocol_id = config.protocol_id;
      this.resultConfig.countFieldColumns = data.config.countFieldColumns;
      this.mappingSortedData = Functions.cloneObject(data.mapping);
      this.resultConfig.fields = data.fields;
      try {
        this.proto.shown = data.fields.find(field => field.field_name === 'proto_selector')?.shown;
        this.field_limit = data.fields.find(field => field.field_name === 'limit');
        this.field_limit.shown = this.field_limit.shown !== false ? true : this.field_limit.shown;

        this.field_targetResultsContainer = data.fields.find(field => field.field_name === 'targetResultsContainer');
        console.log([this.field_targetResultsContainer.value])
        const v = this.field_targetResultsContainer.value;
        if (!Array.isArray(v)) {
          this.targetResultsContainerValue.setValue([v]);
        } else {
          this.targetResultsContainerValue.setValue(v);
        }
        // this.targetResultsContainerValue.setValue(this.field_targetResultsContainer.value);
        this.field_targetResultsContainer.shown = this.field_targetResultsContainer.shown !== false ? true : this.field_targetResultsContainer.shown;
      } catch (e) {
        console.error(e)
      }
      console.log(this.field_targetResultsContainer)
      console.log(this.field_limit)
      console.log(data.config.fields, data.fields)

      this.proto.shown = this.proto.shown !== false;
      if (config.protocol_id) {
        this.proto.hep_alias = config.protocol_id.name;
        this.proto.profile = this.resultConfig.profile;
      }
    } catch (err) {
      this.onNoClick();

      this.dialogAlarm.open(DialogAlarmComponent);

      console.warn('ERROR config broken:', err);
    }
  }

  ngOnInit() {
    this.cdr.detectChanges();
  }
  private getHepId(hep_alias, profile) {
    return this.mappingSortedData.find(i =>
      i.hep_alias === hep_alias &&
      i.profile === profile
    ).hepid;
  }
  compareResultListItem(a: any, b: any): boolean {
    return b && a.id === b.id;
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



      }
      this.resultConfig.fields.forEach(field => {
        if (field.field_name === 'proto_selector') {
          console.log('proto_selector >>> this.proto.shown', this.proto.shown)
          field.shown = this.proto.shown;
        }
      })

      this.field_targetResultsContainer.value = this.targetResultsContainerValue.value;

      this.cdr.detectChanges();
    }, 50);

  }
  onUpdateProto(event: any) {
    this.proto.fields_mapping = event;
    this.onChange();
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  validate(event) {
    event = event.trim();
    if (event === '' || event === ' ') {
      this.isInvalid = true;
    } else {
      this.isInvalid = false;
    }
  }
}
