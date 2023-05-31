import {
  Input,
  Output,
  Component,
  ViewChild,
  EventEmitter,
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IWidget } from '../IWidget';
import { Subscription, Observable, from } from 'rxjs';
import { Functions } from '@app/helpers/functions';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { map, startWith } from 'rxjs/operators';

import {
  DashboardService,
  DashboardEventData,
  SessionStorageService,
  UserSettings,
  PreferenceMappingProtocolService,
  SearchService,
} from '@app/services';
import { ConstValue, UserConstValue } from '@app/models';
import { FormControl } from '@angular/forms';
import { CodeStyleSmartInputFieldComponent } from './code-style-smart-input-field/code-style-smart-input-field.component';
import { SettingSmartInputWidgetComponent } from './setting-smart-input-widget.component';
import { TranslateService } from '@ngx-translate/core'
@Component({
  selector: 'app-smart-input-widget',
  templateUrl: './smart-input-widget.component.html',
  styleUrls: ['./smart-input-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
@Widget({
  title: 'Smart input Search',
  description: 'Display Smart input Search Form',
  category: 'Search',
  subCategory: 'Other',
  indexName: 'smart-input',
  className: 'SmartInputWidgetComponent',
  settingWindow: true,
  submit: true,
  minHeight: 300,
  minWidth: 300,
})
export class SmartInputWidgetComponent
  implements IWidget, OnInit, AfterViewInit, OnDestroy {
  @Input() id: string;

  @Input() config;
  _config: any;
  _fields = [];
  @Input() set fields(val) {
    this._fields = Functions.cloneObject(val);
    console.log(this._fields);
    this.domRefresh();
    this.initSliderSmartInput(true);
  }
  get fields() {
    return this._fields;
  }

  @Input() autoline = false;
  @Input() targetResultId = null;
  @Input() onlySmartField = false;
  onlySmartFieldTEXT = '';
  @Output() changeSettings = new EventEmitter<any>();
  @Output() dosearch = new EventEmitter<any>();
  apiLink = '/smart/search/tag/60/call_h20';
  mappingList: any;
  @ViewChild('onlySmartFieldElement', { static: false })
  onlySmartFieldElement: CodeStyleSmartInputFieldComponent;
  protoconfig;
  private subscriptionStorage: Subscription;
  private dashboardEventSubscriber: Subscription;

  /* LOKI */
  lokiQueryText: string;
  searchQueryLoki: any;

  countFieldColumns = 1;
  fieldsFromSmartInput: any;
  _cache: any;
  buttonState = true;
  searchQuery: any;

  widgetId: string;
  widgetResultList: Array<any>;
  widgetResultListLastSelect: string;
  isConfig = true;
  mapping: any;
  targetResultsContainerValue = new FormControl();
  SmartInputQueryText = '';
  _lastInterval: any;
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private searchService: SearchService,
    private _sss: SessionStorageService,
    private dashboardService: DashboardService,
    public translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    private preferenceMappingProtocolService: PreferenceMappingProtocolService,

  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
  }

  async ngOnInit() {
    this.mappingList = this.preferenceMappingProtocolService.getMerged().toPromise();
    this._config = Functions.cloneObject(this.config);

    WidgetArrayInstance[this.id] = this as IWidget;

    if (!this.config) {
      this.isConfig = false;
      this.config = {
        id: this.id,
        title: 'Smart input Search',
        group: 'Search',
        name: 'smart-input',
        description: 'Display Smart input Search Form component',
        refresh: false,
        sizeX: 2,
        sizeY: 2,
        config: {
          title: 'Smart input Search',
          searchbutton: true,
          protocol_id: {
            name: 'TDR',
            value: 60,
          },
          protocol_profile: {
            name: 'call_h20',
            value: 'call_h20',
          },
        },
        uuid: 'ed426bd0-ff21-40f7-8852-58700abc3762',
        fields: [
          {
            field_name: 'proto_selector',
            form_default: null,
            hepid: 1,
            name: '60:call_h20:proto_selector',
            selection: 'Protocol',
            type: 'string'
          },
          {
            field_name: 'smartinput',
            form_api: '/smart/search/tag/:hepid/:hepprofile',
            form_type: 'smart-input',
            full_api_link: '/smart/search/tag/60/call_h20',
            hepid: 1,
            name: '60:call_h20:smartinput',
            selection: 'Smart Input',
            type: 'string',
            value: '',
          },
          {
            field_name: 'limit',
            form_default: null,
            hepid: 1,
            name: '60:call_h20:limit',
            selection: 'Query Limit',
            type: 'string',
            value: '',
          },
          {
            field_name: 'targetResultsContainer',
            form_default: null,
            hepid: 1,
            name: '1:call:targetResultsContainer',
            selection: 'Results Container',
            type: 'string',
          },
        ],
        countFieldColumns: this.countFieldColumns,
        row: 0,
        col: 1,
        cols: 2,
        rows: 2,
        x: 0,
        y: 1,
      };

    } else {
      this.isConfig = true;
      if (this.config.param) {
        const protocol = Object.keys(this.config.param.search)
          .toString().split('_');
        const protocol_id = protocol.splice(0, 1).toString();
        const protocol_profile = protocol.join('_');
        this.apiLink = `/smart/search/tag/${protocol_id}/${protocol_profile}`;

      }

    }

    this.widgetId = this.id || '_' + Functions.md5(JSON.stringify(this.config));
    this.config.config = this.config.config || {};
    this.config.fields = (this.config.fields || []).map((item) => {
      item.value = '';
      return item;
    });

    this.mapping = await this.preferenceMappingProtocolService
      .getMerged()
      .toPromise();
    this.updateButtonState();
    this.initSubscribes();

  }
  ngAfterViewInit() {
    this.initSliderSmartInput();
  }

  private initSliderSmartInput(onlyFieldsDoParse = false) {
    this.domRefresh();
    if (this.onlySmartFieldElement) {
      const configData =
        this.config && this.config.param && this.config.param.search;
      if (
        onlyFieldsDoParse &&
        configData &&
        Object.keys(configData).length !== 0
      ) {
        const [fields] = Object.values(configData) as any;
        this.onlySmartFieldTEXT = fields
          .map((item) => {
            if (item.name === 'smartinput') {

              return item.value;
            }
            return `${item.name}=${item.value}`;
          })
          .join('');
      } else {
        const fSmartinput = this._fields.find(
          (i) => i.field_name === 'smartinput'
        );
        if (fSmartinput && fSmartinput.value && fSmartinput.value !== '') {
          this.onlySmartFieldTEXT = fSmartinput.value;
        } else {
          this.onlySmartFieldTEXT = this._fields
            .filter((i) => i.value !== '')
            .map((item) => `${item.name}=${item.value}`)
            .join(' AND ');
        }
      }

      this.domRefresh();
      this.onlySmartFieldElement.setQueryText(this.onlySmartFieldTEXT);
    }
  }
  // getFieldColumns() {
  //   if (this.autoline) {
  //     this.countFieldColumns = Math.min(4, this.fields.length);
  //   } else {
  //     this.countFieldColumns =
  //       this.config && this.config.countFieldColumns
  //         ? this.config.countFieldColumns
  //         : this.countFieldColumns;
  //   }
  //   return Array.from(
  //     { length: this.countFieldColumns },
  //     (i) => `${100 / this.countFieldColumns}%`
  //   ).join(' ');
  // }
  getFieldColumns() {
    const shownFields = this.fields.filter(f => f.shown !== false);
    if (this.autoline) {
      this.countFieldColumns = Math.min(4, this.fields.length);
    } else {
      this.countFieldColumns = Math.min(
        this.config?.countFieldColumns || this.countFieldColumns,
        shownFields.length
      );
    }
    switch (this.countFieldColumns) {
      case 1:
        return 'auto'
    }
    return Array.from({ length: this.countFieldColumns }, (i, k) => {
      const out = shownFields[k]?.field_name === 'smartinput' ? 'auto' : '150px';
      return out;
    }).join(' ');
  }

  private initSubscribes() {
    this.subscriptionStorage = this._sss.sessionStorage.subscribe(
      (data: UserSettings) => {
        this._cache = data.protosearchSettings[this.widgetId];

        if (this._cache && this._cache.hasOwnProperty(ConstValue.serverLoki)) {
          this.fields.forEach((item) => {
            if (item.field_name === ConstValue.LIMIT) {
              item.value = this._cache.limit;
            }
            if (item.field_name === ConstValue.CONTAINER) {
              this.lokiQueryText = this._cache.text;
            }
          });
        } else if (this._cache && this._cache.fields) {
          const cacheQuery = this.searchService.getLocalStorageQuery();
          this.fields.forEach((item) => {
            if (item.hasOwnProperty('system_param') && item.mapping) {
              const [
                constParam,
                collectionName,
                propertyName,
              ] = item.mapping.split('.');
              if (
                constParam === 'param' &&
                this._cache[collectionName] &&
                this._cache[collectionName].mapping === propertyName
              ) {

                item.value = this._cache[collectionName].value;
              }
            } else {
              const [f_field] = this._cache.fields.filter(
                (i) => i.name === item.field_name
              );
              item.value = (f_field && f_field.value) || '';
            }

            if (item.formControl) {
              item.formControl.setValue(item.value);
            }
            if (item.field_name === ConstValue.CONTAINER && item.value !== '') {
              if (!Array.isArray(item.value)) {
                this.targetResultsContainerValue.setValue([item.value]);
              } else {
                this.targetResultsContainerValue.setValue(item.value);
              }
            }

            if (
              item.type &&
              (item.type === 'integer' || item.type === 'number') &&
              item.value !== '' &&
              item.value !== null &&
              !isNaN(item.value * 1)
            ) {
              item.value = item.value * 1;
            }

            if (
              item.type &&
              item.type === 'boolean' &&
              (item.value === 'true' || item.value === 'false')
            ) {
              item.value = item.value === 'true';
            }

            if (
              cacheQuery &&
              cacheQuery.location &&
              cacheQuery.location.mapping &&
              item.field_name === cacheQuery.location.mapping &&
              item.form_default
            ) {
              item.value = cacheQuery.location.value.map(
                (i) => item.form_default.find((j) => j.value === i).name
              );
            }
          });
        }
        this.domRefresh();
      }
    );

    this.dashboardEventSubscriber = this.dashboardService.dashboardEvent.subscribe(
      (data: DashboardEventData) => {
        this.widgetResultList = data.currentWidgetList
          .filter(
            (i) => i?.name?.toLowerCase() === 'result' || i?.name === 'display-results-chart'
          )
          .map((i) => ({
            id: i.id,
            title: i.config ? i.config.title : i.id,
            type: 'widget',
          }));
        this.widgetResultList.push({
          id: 'Default',
          title: 'Default',
          type: 'page',
        });

        this.fields.forEach((item) => {
          if (item.field_name === ConstValue.CONTAINER) {
            const _c = this._cache
              ? this._cache.fields.find((i) => i.name === ConstValue.CONTAINER)
              : null;
            if (_c) {
              if (!Array.isArray(_c.value)) {
                this.targetResultsContainerValue.setValue([_c.value]);
              } else {
                this.targetResultsContainerValue.setValue(_c.value);
              }
              item.value = _c.value;
            } else {
              item.value = Functions.cloneObject(this.widgetResultList[0]);
              if (!Array.isArray(item.value)) {
                this.targetResultsContainerValue.setValue([item.value]);
              } else {
                this.targetResultsContainerValue.setValue(item.value);
              }
            }
          }
        });
      }
    );
  }
  private updateButtonState() {

    this.buttonState = this.config.config.searchbutton;

    this.fields = Functions.cloneObject(this.config.fields);

    if (!this.config?.config?.protocol_profile) {
      return;
    }

    const m = this.mapping.find(
      (i) =>
        i.profile === this.config.config.protocol_profile.value &&
        i.hep_alias === this.config.config.protocol_id.name
    );


    if (m && m.fields_mapping) {
      /* patch */

      if (typeof m.fields_mapping === 'string') {
        try {
          m.fields_mapping = JSON.parse(m.fields_mapping);
        } catch (err) {

          m.fields_mapping = [];
        }
      }
      this.fields.forEach((i) => {

        const f = m.fields_mapping.find((j) => j.id === i.field_name);

        if (f && f.type) {
          i.type = f.type;
        }
        if (f && f.form_type) {
          i.form_type = f.form_type;
          if (i.form_type === 'number' || i.form_type === 'integer') {
            i.value = isNaN(i.value * 1) ? 0 : i.value * 1;
          }
        }
        if (f && f.system_param) {
          i.system_param = f.system_param;
        }
        if (f && f.system_param) {
          i.mapping = f.mapping;
        }
        if (f && f.form_api) {
          i.form_api = f.form_api;
        }

        if (f && f.form_default) {
          /* high priority */

          i.form_default = f.form_default;
        } else if (i.form_api) {
          /* seccond priority */
          if (i.form_type === 'smart-input') {
            i.full_api_link = String(i.form_api)
              .replace(':hepid', this.config.config.protocol_id.value)
              .replace(
                ':hepprofile',
                this.config.config.protocol_profile.value
              );

          } else {
            this.preferenceMappingProtocolService
              .getListByUrl(i.form_api)
              .toPromise()
              .then((list: any) => {
                if (list && list.data) {
                  i.form_default = list.data;
                } else {
                  i.form_default = null;
                }
              });
          }
        } else {
          i.form_default = null;

        }
        if (i && i.form_default !== null && i.form_type === 'input') {

          i.formControl = new FormControl();

          i.formControl.setValue(i.value);
          this.autocompliteFiltring(i);
          this.domRefresh();
        }
      });
    }
    this.domRefresh();
  }
  domRefresh() {
    requestAnimationFrame(() => this.cdr.detectChanges())
  }
  private autocompliteFiltring(item: any) {
    const options: Array<any> = item.form_default;
    const _filter = (value: string): string[] => {
      const filterValue = value.toLowerCase();
      item.value = value;

      return options.filter((option: any) => {
        if (typeof option === 'string') {
          return option.toLowerCase().includes(filterValue);
        } else if (typeof option === 'object') {
          return option.name.toLowerCase().includes(filterValue);
        }
      });
    };

    const filteredOptions: Observable<string[]> = item.formControl.valueChanges.pipe(
      startWith(''), map((value: string) => _filter(value))
    );

    item.filteredOptions = filteredOptions;
    this.domRefresh();
  }
  private saveState() {
    if (this.isLoki) {
      this._sss.saveProtoSearchConfig(this.widgetId, this.searchQuery);
      return;
    }
    this.searchQuery = {
      fields: this.fields
        .filter((item: any) => {
          let b;
          if (typeof item.value === 'string') {
            b = item.value !== '';
          } else if (item.form_type === 'select') {
            b = true;
          } else if (['boolean'].includes(item.type)) {
            item.value = item.value === true;
            b = true;
          } else if (['number', 'integer'].includes(item.type)) {
            b =
              item.value !== null &&
              item.value !== undefined &&
              !isNaN(item.value * 1);
          } else if (item.value instanceof Array) {
            b = item.value.length > 0;
          } else if (item.field_name === ConstValue.CONTAINER || item.field_name === ConstValue.SELECT_PROTO) {
            b = true;
          } else {
            b = false;
          }
          return b && !item.hasOwnProperty('system_param');
        })
        .map((item: any) => ({
          name: item.field_name,
          value:
            typeof item.value === 'object' ? item.value : String(item.value),
          type: item.type,
          hepid: item.hepid,
        })),
      protocol_id:
        this.config.config.protocol_id.value +
        '_' +
        this.config.config.protocol_profile.value, // 1_call | 1_ default | 1_registration
    };
    if (this.onlySmartField) {
      this.searchQuery.protocol_id = Functions.JSON_parse(
        localStorage.getItem(UserConstValue.SEARCH_QUERY)
      ).protocol_id ||
        Functions.JSON_parse(
          localStorage.getItem(ConstValue.SEARCH_QUERY)
        ).protocol_id;
    }
    /* system params */
    this.fields.forEach((item: any) => {
      if (
        item.value &&
        item.value !== '' &&
        item.hasOwnProperty('system_param') &&
        item.mapping !== ''
      ) {
        const [constParam, collectionName, propertyName] = item.mapping.split(
          '.'
        );
        if (constParam === 'param' && collectionName) {
          if (item.value instanceof Array && item.form_default) {
            this.searchQuery[collectionName] = {
              value: item.value.map(
                (i) => item.form_default.find((j) => i === j.name).value
              ),
              mapping: propertyName || '',
            };
          } else if (typeof item.value !== 'object') {
            this.searchQuery[collectionName] = {
              value: item.value,
              mapping: propertyName || '',
            };
          }
        }
      }
    });

    this.searchService.setLocalStorageQuery(
      Functions.cloneObject(this.searchQuery)
    );
    this._sss.saveProtoSearchConfig(
      this.widgetId,
      Functions.cloneObject(this.searchQuery)
    );

    this.searchQuery.fields = this.searchQuery.fields.filter(
      (i) => ![ConstValue.CONTAINER, ConstValue.SELECT_PROTO].includes(i.name)
    );
    this.domRefresh();
  }

  onClearFields() {
    this.fields.forEach((item) => {
      if (item.formControl) {
        item.formControl.setValue('');
      }
      if (item.form_type === 'multiselect' || item.value instanceof Array) {
        item.value = [];
      } else if (item.form_type === 'smart-input') {
        item.value = '';
      } else {
        item.value = '';
      }
    });
    this._sss.removeProtoSearchConfig(this.widgetId);
    this.domRefresh();
  }

  public async openDialog() {
    const mapping = await this.preferenceMappingProtocolService
      .getMerged()
      .toPromise();
    const dialogRef = this.dialog.open(SettingSmartInputWidgetComponent, {
      width: '600px',
      data: {
        config: this.config,
        mapping: mapping,
        fields: this.fields,
        widgetResultList: this.widgetResultList
      },
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (!result) {
      return;
    }

    console.log({ result });
    this.config.config.searchbutton = result.isButton;
    this.buttonState = this.config.config.searchbutton;
    this.config.config.protocol_id = result.protocol_id;
    this.config.config.protocol_profile = {
      name: result.profile,
      value: result.profile,
    };
    console.log('result.fields', result.fields);

    // this.fields.forEach((field) => {
    //   console.log({field});
    //   const {value, shown} = result.fields.find(f => f.field_name === field.field_name);
    //   field.value ||= value;
    //   field.shown = shown !== false ? true : shown;
    // });


    this.config.fields = result.fields;
    this.config.countFieldColumns = result.countFieldColumns;
    this.countFieldColumns = result.countFieldColumns;

    this._sss.removeProtoSearchConfig(this.widgetId);
    const _forRestoreFieldsValue = Functions.cloneObject(this.fields);
    this.updateButtonState();
    this.changeSettings.emit({
      config: this.config,
      id: this.id,
    });
    this.fields.forEach((item) => {
      if (item.field_name === ConstValue.CONTAINER && item.value !== '') {
        console.log('after results', Functions.cloneObject(item.value))

        if (!Array.isArray(item.value)) {
          this.targetResultsContainerValue.setValue([item.value]);
        } else {
          this.targetResultsContainerValue.setValue(item.value);
        }
      }
    });
    this.onChangeTargetResultsContainer();

    this.isConfig = true;
    this.domRefresh();

    setTimeout(() => {
      this.domRefresh();
    }, 100)
  }

  onChangeField(event = null, item = null) {
    if (event && item && item.form_type === 'multiselect') {
      item.value = event.value;
    }
    this.fields.forEach((i) => {
      if (i.field_name === ConstValue.CONTAINER) {
        i.value = this.targetResultsContainerValue.value;
      }
      if (
        item &&
        item.field_name === i.field_name &&
        i.form_type === 'multiselect'
      ) {
        i.value = item.value;
      }
    });
    this.saveState();
    this.domRefresh();
  }
  onChangeTargetResultsContainer() {
    this.fields.forEach((i) => {
      if (i.field_name === ConstValue.CONTAINER) {
        i.value = this.targetResultsContainerValue.value;
      }
    });
    this.saveState();
    this.domRefresh();
  }
  doSearchResult() {
    const targetResultSelf = {
      id: this.targetResultId,
      title: '',
      type: this.targetResultId ? 'widget' : 'page',
    };

    const isResultContainer =
      this.fields.filter((i) => i.field_name === ConstValue.CONTAINER).length >
      0;
    const targetResult = this.targetResultId
      ? targetResultSelf
      : this.targetResultsContainerValue.value;
    let _targetResult: any;
    this.saveState();
    if (this.targetResultId || (targetResult && isResultContainer)) {
      _targetResult = Functions.cloneObject(targetResult);
      _targetResult.forEach((target) => {
        if (target.type === 'page') {
          this.router.navigate(['search/result']);
        } else {
          this.dashboardService.setQueryToWidgetResult(target.id, this.searchQuery);
        }
      });
      this.dosearch.emit({});
      this.domRefresh();
      return;
    }
    this.router.navigate(['search/result']);
    this.dosearch.emit({});
    this.domRefresh();
  }

  compareResultListItem(a: any, b: any): boolean {
    return b && a.id === b.id;
  }

  onLokiCodeData(event) {
    this.searchQuery = event;
    this.searchQuery.limit = (
      this.fields.find((i) => i.field_name === ConstValue.LIMIT) || {
        value: 100,
      }
    ).value;
    this.searchQuery.protocol_id = ConstValue.LOKI_PREFIX;
    this.searchQuery.fields = [];
    this.domRefresh();
  }
  onSmartInputCodeData(event, item = null) {
    if (this.onlySmartField) {
      const hepid =
        (this.config &&
          this.config.config &&
          this.config.config.protocol_id &&
          this.config.config.protocol_id.value) ||
        1;
      const [sf] = this.fields;

      if (
        !sf ||
        !(sf.field_name === 'smartinput' && this.fields.length === 1)
      ) {
        this.fields = [
          {
            field_name: 'smartinput',
            hepid,
            name: 'smartinput',
            selection: 'Smart Input',
            type: 'string',
            value: event.text,
          },
        ];
      } else {
        sf.value = event.text;
        sf.hepid = hepid;
      }
    } else {
      this.fields.forEach((i) => {
        if (
          item &&
          item.field_name === i.field_name &&
          i.form_type === 'smart-input'
        ) {
          i.value = event.text;
        }
      });
      this.saveState();
    }
    this.domRefresh();
  }
  private get isLoki(): boolean {
    return this.fields.filter((i) => i.field_name === 'loki').length !== 0;
  }
  public getFields() {
    return Functions.cloneObject(this.fields);
  }
  onProtoChange(evt) {
    this.config.config.protocol_id = evt.protocol_id;
    this.config.config.protocol_profile = {
      name: evt.protocol,
      value: evt.protocol
    };
    if (this.config.param) {
      const protocol = Object.keys(this.config.param.search)
        .toString().split('_');
      const protocol_id = protocol.splice(0, 1).toString();
      const protocol_profile = protocol.join('_');
      this.apiLink = `/smart/search/tag/${protocol_id}/${protocol_profile}`;

    }
    this._sss.removeProtoSearchConfig(this.widgetId);

    /* update the data in here */
    this.updateButtonState();
    this.changeSettings.emit({
      config: this.config,
      id: this.id,
    });

    this.isConfig = true;

    this.fields.forEach((i) => {
      if (i.field_name === ConstValue.SELECT_PROTO) {
        i.value = evt;
      }
    });
    this.saveState();
    this.domRefresh();
  }

  ngOnDestroy() {
    if (this.subscriptionStorage) {
      this.subscriptionStorage.unsubscribe();
    }
    if (this.subscriptionStorage) {
      this.dashboardEventSubscriber.unsubscribe();
    }
    if (this._lastInterval) {
      clearInterval(this._lastInterval);
    }
  }
}
