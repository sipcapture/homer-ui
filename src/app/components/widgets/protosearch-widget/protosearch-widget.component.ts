import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { SettingProtosearchWidgetComponent } from './setting-protosearch-widget.component';
import { Router } from '@angular/router';
import { IWidget } from '../IWidget';
import { Subscription, Observable } from 'rxjs';
import { Functions, log } from '@app/helpers/functions';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { map, startWith } from 'rxjs/operators';
import {
  DashboardService,
  DashboardEventData,
  SessionStorageService,
  UserSettings,
  PreferenceMappingProtocolService,
  SearchService,
  PreferenceAdvancedService,
  PreferenceIpAliasService,
  AlertService,
  AuthenticationService,
} from '@app/services';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ConstValue } from '@app/models';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatCheckboxChange } from '@angular/material/checkbox';

interface SearchFieldItem {
  field_name: string;
  form_type: string;
  hepid: number;
  name: string;
  profile: string;
  selection: string;
  selector?: Array<any>;
  type: string;
  value?: string;
}

@Component({
  selector: 'app-protosearch-widget',
  templateUrl: './protosearch-widget.component.html',
  styleUrls: ['./protosearch-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
@Widget({
  title: 'Proto Search',
  description: 'Display Protocol Search Form',
  category: 'Search',
  subCategory: 'Protocol',
  indexName: 'display-results',
  className: 'ProtosearchWidgetComponent',
  submit: true,
  minHeight: 300,
  minWidth: 300,
})
export class ProtosearchWidgetComponent implements IWidget, OnInit, OnDestroy, AfterViewInit {

  @Input() id: string;
  @Input() config: any;
  @Input() fields = [];
  @Input() autoline = false;
  @Input() targetResultId = null;
  @Output() changeSettings = new EventEmitter<any>();
  @Output() dosearch = new EventEmitter<any>();
  private subscriptionStorage: Subscription;
  private dashboardEventSubscriber: Subscription;
  isRefresh = false;
  isReset = false;

  defaultContainer = {
    id: 'Default',
    title: 'Default',
    type: 'page',
  };
  locationNode: any = null;
  locationGroup: any = null;
  profileFields: [];
  lokiQueryText: string;
  searchQueryLoki: any;
  isDefaultSearchType;
  defaultSearchTypes: any;
  countFieldColumns = 1;
  searchTabs: any;
  _cache: any;
  orLogic = false;
  archive = false;
  buttonState = true;
  searchQuery: any;
  profile_fields;
  profileList;
  widgetId: string;
  widgetResultList: Array<any>;
  widgetResultListLastSelect: string;
  isConfig = false;
  // status chips config
  mapping: any;

  currentProtocol: string;
  chipsObj: {};
  aliasObj: {};
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  aliasSelection = 'alias';
  aliases = [];
  searchFunctions: any;
  targetResultsContainerValue = new FormControl();
  firstWidgetContainer: any;
  noFunctions = false;
  isWidgetInited = false;
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private searchService: SearchService,
    private _pas: PreferenceAdvancedService,
    private _sss: SessionStorageService,
    private dashboardService: DashboardService,
    private _ipas: PreferenceIpAliasService,
    private cdr: ChangeDetectorRef,

    private preferenceMappingProtocolService: PreferenceMappingProtocolService,
    private alertService: AlertService,
    private authenticationService: AuthenticationService,
    private translateService: TranslateService
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
  }

  ngAfterViewInit() {
    this.chipsObj = {};
    this.aliasObj = {};
  }
  async ngOnInit() {
    // SET DEFAULT CONTAINER
    this.targetResultsContainerValue.setValue([
      this.defaultContainer,
    ]);

    await this.getIpAliases();
    this.mapping = await this.preferenceMappingProtocolService
      .getMerged()
      .toPromise();

    let actualMapping = [];
    this.aliasObj = Functions.getAliasFields(this.aliases);
    WidgetArrayInstance[this.id] = this as IWidget;


    if (!this.config) {
      this.isConfig = false;

      this.config = {
        id: this.id,
        title: 'Proto Search',
        group: 'Search',
        name: 'protosearch',
        description: 'Display Search Form component',
        refresh: false,
        sizeX: 2,
        sizeY: 2,
        config: {
          title: 'TDR CALL SEARCH',
          searchbutton: true,
          protocol_id: {
            name: 'TDR',
            value: 60,
          },
          protocol_profile: {
            name: 'call_h20',
            value: 'call_h20',
          },
          fields: [{
            field_name: 'callid',
            form_default: null,
            form_type: 'input',
            hepid: 60,
            name: '60:call_h20:callid',
            selection: 'Call-ID',
            type: 'string',
            value: ''
          },
          {
            field_name: 'targetResultsContainer',
            form_default: null,
            hepid: 60,
            name: '60:call_h20:targetResultsContainer',
            selection: 'Results Container',
            type: 'string'
          }],

        },
        uuid: Functions.newGuid(),
        fields: [{
          field_name: 'callid',
          form_default: null,
          form_type: 'input',
          hepid: 60,
          name: '60:call_h20:callid',
          selection: 'Call-ID',
          type: 'string',
          value: ''
        },
        {
          field_name: 'targetResultsContainer',
          form_default: null,
          hepid: 60,
          name: '60:call_h20:targetResultsContainer',
          selection: 'Results Container',
          type: 'string'
        }],
        countFieldColumns: this.countFieldColumns,
        row: 0,
        col: 1,
        cols: 2,
        rows: 2,
        x: 0,
        y: 0,
      };
      this.isConfig = true;
      this.isWidgetInited = true;
      this.cdr.detectChanges()
    } else {
      const mapHepId = this.config.config.protocol_id.value;
      const mapProfile = this.config.config.protocol_profile.name;
      actualMapping = this.mapping?.find(f => f.hepid === mapHepId && f.profile === mapProfile)?.fields_mapping;
      this.isConfig = true;
      this.isWidgetInited = true;
    }
    this.widgetId =
      this.id || '_' + Functions.md5(JSON.stringify(this.config));
    this.config.id = this.id;
    this.config.config = this.config.config || {};
    this.config.fields = (this.config.fields || []).map((item) => {
      item.value = item.type === 'boolean' ? false : '';
      return item;
    });

    this.fields = this.config.fields || [];
    if (actualMapping.length > 0) {
      this.fields.forEach(field => {
        const actualField = actualMapping.find(f => f.id === field.field_name);
        if (actualField) {
          field.selection = actualField?.name;
        }
      })
    }
    this.searchFunctions = await this._pas.getAll().toPromise();
    this.searchFunctions = this.searchFunctions?.data?.filter(
      ({ category, param }) => category === 'search' && param === 'functions'
    );
    if (this.searchFunctions?.[0]?.data?.length) {
      this.searchFunctions = this.searchFunctions[0].data;
    } else {
      this.noFunctions = true;
    }
    this.updateButtonState();

    this.initSubscribes();

    this.cdr.detectChanges();

  }

  async getIpAliases() {
    try {
      const alias: any = await this._ipas.getAll();
      if (alias?.data) {
        this.aliases = alias.data;
      }
    } catch (err) { }
  }

  isAliasField(field) {
    return Functions.isAMF(field);
  }
  getFieldColumns() {
    if (this.autoline) {
      this.countFieldColumns = Math.min(4, this.fields.length);
    } else {
      this.countFieldColumns =
        this.config && this.config.countFieldColumns
          ? this.config.countFieldColumns
          : this.countFieldColumns;
    }
    return Array.from(
      { length: this.countFieldColumns },
      (i) => `${100 / this.countFieldColumns}%`
    ).join(' ');
  }
  async getDefaultSearchTypes() {
    return await this._pas
      .getSetting('search-types', 'custom-widget')
      .then((types) => types[0].data);
  }

  private locationNodeRestore() {
    const location = this.locationNode;
    const cacheQuery = this.searchService.getLocalStorageQuery(true);
    const item = this.fields?.find(
      (i) =>
        i.field_name === cacheQuery?.location?.mapping && i.form_default && i.field_name === 'node'
    );

    if (!item || !location) {
      return;
    }

    item.value = location.value.map(
      (i) => item.form_default.find((j) => j.value === i && j.online !== false)?.name
    );

    this.cdr.detectChanges();
  }

  private locationGroupRestore() {
    const location_group = this.locationGroup;
    const item = this.fields?.find(
      (i) => i.field_name === 'nodesgroup'
    );
    if (!item || !location_group) {
      return;
    }
    item.value = location_group.value.map(
      (i) => item.form_default?.find((j) => j.value === i)?.name
    );
  }
  private initSubscribes() {
    this.subscriptionStorage = this._sss.sessionStorage.subscribe(
      (data: UserSettings) => {
        if (data.searchTabs?.length) {
          log('this._sss.sessionStorage.subscribe:::', data);
          this.searchTabs = data.searchTabs;
          if (this.widgetResultList) {
            this.widgetResultList = this.widgetResultList.filter(
              (f) => f.type !== 'searchResultTab'
            );
            this.searchTabs.forEach((tab) => {
              this.widgetResultList.push({
                id: tab.id,
                title: tab.name,
                type: 'searchResultTab',
              });
            });
            const firstWidget = this.widgetResultList.find(
              (f) => f.isDisplayGrid
            );
            if (firstWidget && !this.isLoki) {
              this.targetResultsContainerValue.setValue([
                firstWidget,
              ]);
            }
            this.cdr.detectChanges();
          }
        }
        this._cache = data.protosearchSettings[this.widgetId];

        // console.log("this._cache", this._cache);

        if (this._cache) {
          if (this.searchQuery) {

            this.searchQuery['archive'] = this.archive;
            // console.log("this.archive", this.archive)

          }
          // console.log(this._cache)
          const { fields, location, locationGroup } = this._cache || {};

          /** restore LOCATION NODE */
          this.locationNode = location;

          /** restore LOCATION NODE_GROUP */
          this.locationGroup = locationGroup;

          if (fields) {
            const arrfields = [].concat(
              fields.find((f) => f.type === 'array_string') || []
            );
            arrfields?.forEach((field) => {
              if (field.value.length > 0) {
                this.chipsObj[
                  field.name
                ] = field.value.map((m) => ({ val: m }));
              }
            });
          }
        }

        if (data.searchTabs) {
          this.searchTabs = data.searchTabs;
        }
        if (data.profile_fields) {
          this.profileFields = data.profile_fields;
        }

        if (
          this._cache?.hasOwnProperty(ConstValue.serverLoki)
        ) {
          this.fields?.forEach((item) => {
            if (item.field_name === ConstValue.LIMIT) {
              item.value = this._cache.limit;
            }
            if (item.field_name === ConstValue.CONTAINER) {
              this.lokiQueryText = this._cache.text;
            }
          });
        } else if (this._cache?.fields) {
          const cacheQuery = this.searchService.getLocalStorageQuery(
            true
          );

          this.fields?.forEach((item) => {
            if (
              item.type === 'array_string' &&
              !this.chipsObj[item.selection]
            ) {
              this.chipsObj[item.selection] = [];
            }
            if (
              item.hasOwnProperty('system_param') && item?.mapping
            ) {
              const [
                constParam,
                collectionName,
                propertyName,
              ] = item.mapping.split('.');

              if (
                constParam === 'param' &&
                this._cache?.[collectionName]?.mapping === propertyName &&
                this._cache?.[collectionName]?.value
              ) {
                item.value = this._cache[collectionName].value;
              }
              if (item.field_name === 'archive') {
                item.value = this._cache?.archive || false;
                this.archive = item.value;
                if (this.searchQuery) {
                  this.searchQuery['archive'] = this.archive
                  // console.log("this.archive", this.archive)

                }
              }
            } else if (item.hasOwnProperty('profile')) {

              const f_field = this._cache.fields.find(
                i => i.name === item.field_name
              );
              const _fromSearchQuery = this._cache?.profile_custom_field;
              item.value = (f_field?.value) || _fromSearchQuery || '';
            } else {
              const f_field = this._cache.fields.find(
                i => i.name === item.field_name
              );
              const func = (f_field?.func) || '';
              if (!this.noFunctions && func !== '') {
                item.func = this.searchFunctions.find(
                  (_func) => _func.name === func.name
                );
              } else {
                item.func = func;
              }
              item.value = (f_field && (f_field.source_value || f_field.value)) || '';
            }

            if (item.formControl) {
              item.formControl.setValue(item.value);
            }

            if (
              item.field_name === ConstValue.CONTAINER &&
              item.value !== ''
            ) {
              if (!Array.isArray(item.value)) {
                this.targetResultsContainerValue.setValue([
                  item.value,
                ]);
              } else {
                this.targetResultsContainerValue.setValue(
                  item.value
                );
              }

            }

            if (
              item.type &&
              (item.type === 'integer' ||
                item.type === 'number') &&
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
            this.locationNodeRestore();
            this.locationGroupRestore();
          });
        }
        this.cdr.detectChanges();
      }
    );
    this.dashboardEventSubscriber = this.dashboardService.dashboardEvent.subscribe(
      (data: DashboardEventData) => {
        const dbs = DashboardService.dbSetting;
        if (dbs.currentWidgetList.length > 0) {
          this.widgetResultList = dbs.currentWidgetList
            .filter(
              (i) =>
                (i?.name &&
                  i?.name?.toLowerCase() === 'result') ||
                (i?.name && i?.name === 'display-results-chart')
            )
            .map((i) => ({
              id: i.id,
              title: (i.config ? i.config.title : i.title ? i.title : i.id) || i.id,
              type: 'widget',
              isDisplayGrid:
                i.strongIndex === 'ResultWidgetComponent',
            }));
        } else {
          this.widgetResultList = [];
        }
        this.firstWidgetContainer = [
          this.widgetResultList.length
            ? this.widgetResultList.find(f => f.isDisplayGrid)
            : this.defaultContainer
        ];
        this.widgetResultList.push({
          id: 'Default',
          title: 'Default',
          type: 'page',
        });
        if (
          typeof this.searchTabs !== 'undefined' &&
          this.searchTabs.length > 0
        ) {
          this.searchTabs.forEach(f => {
            this.widgetResultList.push({
              id: f.id,
              title: f.name,
              type: 'searchResultTab',
            });
          });
        }
        if (
          data.currentProfileList &&
          data.currentProfileList.length > 0
        ) {
          this.profileList = data.currentProfileList.map((i) => ({
            alias: i.alias,
            profile: i.profile,
            hepid: i.hepid,
          }));
        }
        this.fields.forEach((item) => {
          if (item.field_name === ConstValue.CONTAINER) {
            const _c = this._cache
              ? this._cache.fields.find(
                (i) => i.name === ConstValue.CONTAINER
              )
              : null;
            if (_c) {
              if (!Array.isArray(_c.value)) {
                this.targetResultsContainerValue.setValue([
                  _c.value,
                ]);
              } else {
                this.targetResultsContainerValue.setValue(
                  _c.value
                );
              }
              item.value = _c.value;
            } else {
              item.value = Functions.cloneObject(
                this.widgetResultList[0] ||
                this.defaultContainer
              );
              if (!Array.isArray(item.value)) {
                this.targetResultsContainerValue.setValue([
                  item.value,
                ]);
              } else {
                this.targetResultsContainerValue.setValue(
                  item.value
                );
              }
            }
            // log('[DB>]this.targetResultsContainerValue.value', this.targetResultsContainerValue.value);
          }
        });
        if (this.widgetResultList.length <= 1) {
          this.targetResultsContainerValue.setValue([this.defaultContainer])
          this.targetResultsContainerValue.updateValueAndValidity();
        }
        this.cdr.detectChanges();
      }
    );
  }

  addFunction(func: any, field: string) {
    const fieldObj = this.fields[
      this.fields.findIndex((object) => object.field_name === field)
    ];
    if (func.name === 'none') {
      func.name = '';
    }
    if (func.isEmpty) {
      if (fieldObj.formControl) {
        fieldObj.formControl.setValue('');
      }
      if (
        fieldObj.form_type === 'multiselect' ||
        fieldObj.value instanceof Array
      ) {
        fieldObj.value = [];
      } else {
        fieldObj.value = '';
      }
    }
    fieldObj.func = func;
    this.saveState();
    this.cdr.detectChanges();
  }
  isMulti(item) {
    return [
      'server_type_in',
      'server_type_out',
      'ipgroup_in',
      'ipgroup_out'
    ].includes(item);
  }
  getTypeOfField(item): string {
    if (item.field_name === 'targetResultsContainer') {
      return 'targetResultsContainer';
    }
    if (item.field_name === 'loki') {
      return 'LOKI_field';
    }
    if (item.form_type === 'smart-input') {
      return 'smart-input';
    }
    if (item.type === 'boolean') {
      return 'check-box-field';
    }
    if (item.type === 'array' && item.form_type !== 'input_multi_select' && !this.isMulti(item.field_name) && !this.isAliasField(item.field_name)) {
      return 'type-array';
    }
    if (item.form_type === 'input_multi_select' || this.isMulti(item.field_name) || this.isAliasField(item.field_name)) {

      return 'input-multi-select-with-chips';
    }
    if (item.type === 'array_string' && !this.isMulti(item.field_name) && !this.isAliasField(item.field_name)) {
      return 'chip-list-array-string';
    }
    if (item.field_name !== 'loki' &&
      item.field_name !== 'targetResultsContainer' &&
      !this.isAliasField(item.field_name) &&
      item.form_type !== 'smart-input' &&
      item.form_type !== 'input_multi_select' &&
      item.type !== 'array_string' &&
      item.type !== 'boolean' &&
      item.type !== 'array'
    ) {

      if (!item.form_default && (item.type !== 'number' && item.type !== 'integer') && !this.isMulti(item.field_name) && !this.isAliasField(item.field_name)) {
        return 'Text-field-Default';
      }
      if (!item.form_default && (item.type === 'number' || item.type === 'integer')) {
        return 'Text-field-number';
      }
      if (item.form_default && item.form_type === 'input') {
        return 'Text-field-Autocomplete';
      }
      if (item.form_type === 'select' && item.form_default) {
        return 'select-field';
      }
      if (item.form_type === 'multiselect' && item.form_default) {
        return 'multi-select-field';
      }
    }
    return '';
  }
  getFunctionTooltip(func) {
    if (func.description && func.guide) {
      return func.description + ' Click to get more info';
    } else if (func.guide) {
      return 'Click to get more info';
    } else {
      return func.description;
    }
  }

  private updateButtonState() {
    this.buttonState = this.config.config.searchbutton;

    this.fields = Functions.cloneObject(this.config.fields);

    if (
      !(
        this.config &&
        this.config.config &&
        this.config.config.protocol_profile
      )
    ) {
      return;
    }

    const m = this.mapping?.find(
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

        i.__mapping = f;

        if (f?.type) {
          i.type = f.type;
        }
        if (f?.form_type) {
          i.form_type = f.form_type;
          // if (i.form_type === 'number' || i.form_type === 'integer') {
          //     i.value = isNaN(i.value * 1) ? 0 : i.value * 1;
          // }
        }
        if (f?.system_param) {
          i.system_param = f.system_param;
        }
        if (f?.system_param) {
          i.mapping = f.mapping;
        }
        if (f?.form_api) {
          i.form_api = f.form_api;
        }

        if (f?.profile) {
          /**custom profiles inside search */
          i.profile = f.profile;
        }

        if (f?.form_api) {
          i.form_api = f.form_api;
          this.preferenceMappingProtocolService
            .getListByUrl(i.form_api)
            .toPromise()
            .then((list: any) => {
              if (list && list.data) {


                try {
                  if (list.data[0].length) {
                    i.form_default = list.data.map(m => ({ name: m, value: m }))
                  } else {
                    i.form_default = list?.data?.sort((a, b) => a?.name?.localeCompare(b?.name));
                  }
                } catch (e) {
                  console.log(e)
                }

              } else {
                if (f.form_default) {
                  i.form_default = f.form_default;
                }
                i.form_default = null;
              }
              this.locationNodeRestore();
              this.locationGroupRestore();
            });
        }
        if (f?.form_default) {
          /* high priority */
          i.form_default = f.form_default;
        }
        if (i?.form_default && i.form_type === 'input') {
          i.formControl = new FormControl();
          i.formControl.setValue(i.value);
          this.autocompliteFiltring(i);
        }
      });
    }
    this.cdr.detectChanges();
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

    const filteredOptions: Observable<
      string[]
    > = item.formControl.valueChanges.pipe(
      startWith(''),
      map((value: string) => _filter(value))
    );

    item.filteredOptions = filteredOptions;
    this.cdr.detectChanges();
  }

  private saveState() {
    if (this.isLoki) {
      this.searchQuery.fields = this.fields;

      this.searchService.setLocalStorageQuery(
        Functions.cloneObject(this.searchQuery)
      )
      this._sss.saveProtoSearchConfig(this.widgetId, this.searchQuery);
      return;
    }

    let protocol = this.config.config.protocol_id.value;
    let profile = this.config.config.protocol_profile.value;
    this.searchQuery = {
      fields: this.fields
        .filter((item: any) => {
          let b;
          if (typeof item.value === 'string') {
            b =
              item.value !== '' ||
              (item.func && item.func.name !== 'None') ||
              false;
          } else if (item.form_type === 'select') {
            b = true;
          } else if (
            item.type === 'array_string' &&
            item.value instanceof Array
          ) {
            b = item.value.length > 0;
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
          } else if (item.field_name === ConstValue.CONTAINER) {
            b = true;
          } else {
            b = false;
          }
          return (
            b &&
            !item.hasOwnProperty('system_param') &&
            !item.hasOwnProperty('profile')
          );
        })
        .map((item: any) => ({
          name: item.field_name,
          value:
            typeof item.value === 'object'
              ? item.value
              : String(item.value),
          func: item.func ? item.func : null,
          type: item.type,
          hepid: item.hepid,
        })),
      protocol_id: protocol + '_' + profile, // 1_call | 1_ default | 1_registration
    };
    const profile_custom_field = this.fields.find(i => i.hasOwnProperty('profile'));
    if (profile_custom_field?.value) {
      this.searchQuery['profile_custom_field'] = profile_custom_field?.value;
    }

    if (!this.fields.find(i => i.field_name === 'archive')) {
      this.archive = false;
    }
    // console.log("this.archive", this.archive)
    const locationGroupFeald = this.fields.find(i => i.field_name === 'nodesgroup');
    if (locationGroupFeald) {
      console.log({ locationGroupFeald })
      this.searchQuery['locationGroup'] = {
        value: locationGroupFeald.value || [],
        mapping: 'group'
      }; //locationGroupFeald.value;
    }
    /* system params */
    this.fields.forEach((item: any) => {
      if (
        item.value &&
        item.hasOwnProperty('system_param') &&
        item.mapping !== ''
        && item.field_name !== 'nodesgroup'
      ) {
        const [
          constParam,
          collectionName,
          propertyName,
        ] = item.mapping.split('.');

        if (constParam === 'param' && collectionName) {
          if (item.value instanceof Array && item.form_default) {
            this.searchQuery[collectionName] = {
              value: item?.value?.map(
                (i: any) =>
                  item?.form_default?.find(
                    (j: any) => i === j?.name
                  )?.value
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


      // if (
      //     item.value &&
      //     item.value !== '' &&
      //     item.hasOwnProperty('profile')
      // ) {
      //     this.config.config.protocol_profile.value = item.value;
      //     // profile = item.value;
      //     this.searchQuery['protocol_id'] = protocol + '_' + item.value;
      // }
    });

    /** if mapping has m.transform */
    const rx = {
      PARENT: '::input.parent::',
      ID: '::input.id::',
      VALUE: '::value::'
    };

    this.fields.forEach((item: any) => {
      const { virtual, transform, parent, id } = item.__mapping || {};
      if (virtual && transform && parent) {
        const sqf = this.searchQuery.fields.find(i => i.name === item.field_name) || {};
        sqf.source_value = item.value;
        sqf.value = transform
          .replace(rx.PARENT, parent)
          .replace(rx.ID, id)
          .replace(rx.VALUE, item.value);
      }
    });

    this.searchQuery['orlogic'] = this.orLogic;
    this.searchQuery['archive'] = this.archive;
    // console.log("this.archive", this.archive)

    this.searchService.setLocalStorageQuery(
      Functions.cloneObject(this.searchQuery)
    );

    this._sss.saveProtoSearchConfig(
      this.widgetId,
      Functions.cloneObject(this.searchQuery)
    );

    this.searchQuery.fields = this.searchQuery.fields.filter(
      (i) => i.name !== ConstValue.CONTAINER
    );


    this.cdr.detectChanges();
  }

  onTogleOrButton() {
    this.orLogic = this.orLogic ? false : true;
    this.cdr.detectChanges();
  }
  onToggleArchive() {
    this.archive = this.archive ? false : true;
    // console.log("this.archive", this.archive)
    this.cdr.detectChanges()
  }
  onClearFields() {
    this.fields.forEach((item) => {
      if (item.field_name === ConstValue.CONTAINER) {
        return;
      }
      if (item.formControl) {
        item.formControl.setValue('');
      }
      if (
        item.form_type === 'multiselect' ||
        item.value instanceof Array
      ) {
        item.func = '';
        item.value = [];
        this.chipsObj[item.selection] = [];
      } if (item.form_type === 'checkbox') {
        item.func = '';
        item.value = false
      }
      else {
        item.func = '';
        item.value = '';
      }
    });

    this._sss.removeProtoSearchConfig(this.widgetId);
    // this.searchService.clearLocalStorageSEARCH_QUERY();
    this.cdr.detectChanges();
  }

  public async openDialog() {
    this.config.countFieldColumns =
      this.config && this.config.countFieldColumns
        ? this.config.countFieldColumns
        : this.countFieldColumns;
    const dialogRef = this.dialog.open(SettingProtosearchWidgetComponent, {
      width: '600px',
      data: {
        isContainer: this.autoline,
        config: this.config,
        mapping: this.mapping,
        isButton: this.buttonState,
        isReset: this.isReset
      },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (!result) {
      return;
    }
    if (result.fields && result.fields.length !== 0) {
      this.config.config.protocol_id = result.protocol_id;
      this.config.config.protocol_profile = {
        name: result.profile,
        value: result.profile,
      };
      if (result.isReset) {
        this.config.fields = result.fields.map((item) => {
          const res: SearchFieldItem = {
            field_name: item.field_name,
            form_type: item?.proto?.hep_alias,
            hepid: result.protocol_id.value,
            name: `${result.protocol_id.value}:${result.profile}:${item.id}`,
            profile: item?.proto?.profile,
            selection: item.selection,
            selector: item.selector || [],
            type: item.type,
          };
          return res;
        });
        this.isReset = true;
      } else {
        this.config.fields = result.fields.map((item) => {
          const res: SearchFieldItem = {
            field_name: item.id,
            form_type: item?.proto?.hep_alias,
            hepid: result.protocol_id.value,
            name: `${result.protocol_id.value}:${result.profile}:${item.id}`,
            profile: item?.proto?.profile,
            selection: item.name,
            selector: item.selector || [],
            type: item.type,
          };
          return res;
        });
      }
    }
    this.config.title = result.title;
    this.config.config.title = result.title;
    this.config.config.searchbutton = !!result.isButton;
    this.config.countFieldColumns = result.countFieldColumns;
    this._sss.removeProtoSearchConfig(this.widgetId);
    const _forRestoreFieldsValue = Functions.cloneObject(this.fields);
    this.updateButtonState();
    this.fields.forEach((i) => {
      const restore = _forRestoreFieldsValue?.find(
        (j) => j?.field_name === i?.field_name
      );
      if (restore) {
        i.value = restore.value;
        if (i.formControl) {
          i.formControl.setValue(restore.value);
        }
      }
    });

    this.changeSettings.emit({
      config: this.config,
      id: this.id,
    });
    this.isConfig = true;
    this.isWidgetInited = true;
    this.onChangeField();
    this.cdr.detectChanges();
  }

  getSearchFunctions(type) {
    return this.searchFunctions?.filter((func) => {
      if (Array.isArray(func.types)) {
        return func?.types?.some((funcType) => funcType === type);
      } else {
        return func.types === 'all' || func.types === type;
      }
    });
  }

  onChangeField(event: any = null, item = null) {
    console.log({item, event})
    if (event && item?.form_type === 'input_multi_select') {
      item.value = event;
    }

    this.fields.forEach((i) => {

      if (i.field_name === ConstValue.CONTAINER) {
        i.value = this.targetResultsContainerValue.value;
      }
      if (
        item?.field_name === i?.field_name &&
        i?.form_type === 'multiselect'
      ) {
        // console.log(item, i)
        i.value = item.value;
      }
      if (item?.field_name === i?.field_name &&
        i?.field_name === 'archive') {
        this.archive = item.value;
        i.value = item.value;
      }
      if (
        (i?.field_name === item?.field_name &&
          i?.form_type === 'input_multi_select') ||
        (i?.field_name === item?.field_name &&
          this.isMulti(item?.field_name))

      ) {

        if (
          i.field_name === 'status' &&
          i?.value?.length === 1 &&
          i.value[0] === 0
        ) {
          i.value = '';
        }

        i.value = item.value;

      }
      if (
        i?.field_name === item?.field_name &&
        i?.field_name === ConstValue.LIMIT
      ) {
        i.value = parseInt(item.value?.replace(/\D/, ''), 10);
      }
    });

    this.saveState();
    this.cdr.detectChanges();
  }

  addCustomItem(item: { value: string; name: string }) {
    return { value: item, name: item };
  }

  onChangeTargetResultsContainer() {
    log('PSch::>:onChangeTargetResultsContainer');
    const Default = 'Default';
    const selectedFields = (this.fields.find(
      (f) => f.field_name === ConstValue.CONTAINER
    ) || {})['value'];
    if (
      selectedFields?.length > 0 &&
      (selectedFields[0] || {}).id === Default &&
      this.targetResultsContainerValue.value.length === 0
    ) {
      const firstWidget = this.widgetResultList.find(
        (f) => f.isDisplayGrid
      );
      this.targetResultsContainerValue.setValue([firstWidget]);
    } else if (
      selectedFields.length === 1 &&
      selectedFields.some((s) => s?.id === Default)
    ) {
      this.targetResultsContainerValue.setValue(
        this.targetResultsContainerValue.value.filter(
          (f) => f.id !== Default
        )
      );
    } else if (
      this.targetResultsContainerValue.value.find((f) => f.id === Default)
    ) {
      this.targetResultsContainerValue.setValue([this.defaultContainer]);
    } else if (!this.targetResultsContainerValue.value.length) {
      const firstWidget = this.widgetResultList.find(
        (f) => f.isDisplayGrid
      );
      this.targetResultsContainerValue.setValue(
        !selectedFields.length
          ? [firstWidget]
          : [this.defaultContainer] || [firstWidget]
      );
    }
    this.fields.forEach((i) => {
      if (i.field_name === ConstValue.CONTAINER) {
        i.value = this.targetResultsContainerValue.value;
      }
    });

    this.saveState();
    this.cdr.detectChanges();
  }
  doSearchResult(type = 'normal') {
    const targetResultSelf = {
      id: this.targetResultId,
      title: '',
      type: this.targetResultId ? 'widget' : 'page',
    };

    const containerValue = (this.fields?.find(
      (i) => i?.field_name === ConstValue?.CONTAINER
    )?.value) || 'Default';
    if (containerValue === null ||
      (Array.isArray(containerValue) && containerValue[0] === null) ||
      (Array.isArray(containerValue) && !this.widgetResultList.some(
        widget => widget.id === (containerValue?.[0] || {}).id
      ))
    ) {
      const firstWidget = this.widgetResultList.find(
        (f) => f.isDisplayGrid
      );
      this.targetResultsContainerValue.reset();
      this.targetResultsContainerValue.setValue([firstWidget || this.defaultContainer]);

      log('setValue', this.targetResultsContainerValue.value);
      this.alertService.warning({ isTranslation: true, message: 'notifications.notice.resultContainerReset' });
      this.onChangeTargetResultsContainer();
    }
    const isResultContainer = !!this.fields.find(
      (i) => i.field_name === ConstValue.CONTAINER
    );
    const targetResult = this.targetResultId
      ? targetResultSelf
      : this.targetResultsContainerValue.value;
    let _targetResult: any;

    this.saveState();

    if (this.targetResultId || (targetResult && isResultContainer) || type !== 'normal') {
      _targetResult = Functions.cloneObject(targetResult);
      if (_targetResult !== null && type === 'normal') {
        _targetResult.forEach((target) => {
          if (target.type === 'page') {
            this.router.navigate(['search/result']);
          } else if (target.type === 'searchResultTab') {
            const sourceLink = this.dashboardService.getCurrentDashBoardId();
            const updatedObject = {
              id: target.id,
              title: ConstValue.SEARCH_TABS,
              owner: this.authenticationService.currentUserValue.user,
              sourceLink: sourceLink,
              link: target.id,
              type: 6,
              query: this.searchQuery,
              slider: this.searchQuery,
              config: this.config.config,
              name: target.title,
            };
            const updatedSearchObject = this.searchTabs.filter(
              (f) => f.id !== target.id
            );
            updatedSearchObject.push(updatedObject);
            this._sss.saveSearchTabsConfig(updatedSearchObject);
            this.onSearchTabAdd(updatedObject);

            this.dashboardService.setSliderQueryDataToWidgetResult(
              updatedObject.id,
              updatedObject.query
            );

            this.dashboardService.setQueryToWidgetResult(
              updatedObject.id,
              updatedObject.query
            );

            this.cdr.detectChanges();
          } else {

            this.dashboardService.setQueryToWidgetResult(
              target.id,
              this.searchQuery
            );
          }
        });
      }
      if (type === 'searchTab') {
        const uuid = Functions.newGuid();
        // here search for the current config of tab?
        if (this.searchTabs) {
          const sourceLink = this.dashboardService.getCurrentDashBoardId();
          const tabSearchObj = {
            id: uuid,
            title: ConstValue.SEARCH_TABS,
            source_link: sourceLink,
            owner: this.authenticationService.currentUserValue.user,
            link: uuid,
            type: 6,
            query: this.searchQuery,
            slider: this.searchQuery,
            config: this.config.config,
            name: 'Tab-' + (this.searchTabs.length + 1),
          };

          this.searchTabs.push(tabSearchObj);

          this._sss.saveSearchTabsConfig(this.searchTabs);

          this.onSearchTabAdd(tabSearchObj); // look for this one
          this.dashboardService.setSliderQueryDataToWidgetResult(
            tabSearchObj.id,
            tabSearchObj.query
          );

          this.dashboardService.setQueryToWidgetResult(
            tabSearchObj.id,
            tabSearchObj.query
          );

          this.cdr.detectChanges();
        }
      } else if (type === 'tab') {
        const tabId = Functions.newGuid();

        const tabLink = 'search/result/' + tabId;

        this.router.navigate([]).then((result) => {
          window.open(tabLink, '_blank');
        });
      }
      this.dosearch.emit({});

      return;
    }

    this.cdr.detectChanges();

    this.router.navigate(['search/result']);

    this.dosearch.emit({});
  }

  async onSearchTabAdd(searchObj) {
    const { id, title, query, name, config } = searchObj;
    const searchTab: any = {};

    searchTab.data = {
      auth: 'ok',
      nameNewPanel: name,
      data: {
        alias: name,
        config: {
          columns: 8,
          gridType: 'fit',
          ignoreMinSize: 'warning',
          maxrows: 5,
          pushing: false,
        },
        dashboardId: id || name,
        id: id,
        name: name,
        param: 'search_tab', //NAME?
        isTab: true,
        type: 6,
        selectedItem: '',
        shared: false,
        weight: 10,
        widgets: [
          {
            id: id,
            cols: 8,
            config: {
              title: name,
              profile: config.profile || 'call_h20',
              protocol_id: {
                name: config.protocol_id.name || 'TDR',
                value: config.protocol_id.value || 60,
              },
              protocol_profile: {
                name:
                  config.protocol_profile.name || 'call_h20',
                value:
                  config.protocol_profile.value || 'call_h20',
              },
              searchbutton: config.searchbutton || true,
              type: config.type || 'TDR',
            },
            fields: searchTab['fields'] || [],
            sWarning: false,
            minItemCols: 1,
            minItemRows: 1,
            output: {},
            rows: 5,
            strongIndex: 'ResultWidgetComponent',
            title: name,
            x: 0,
            y: 0,
          },
        ],
      },
      status: 'ok',
      total: 1,
    };

    const { data } = searchTab || {};
    if (data) {
      let dashboardData = {
        id: id,
        alias: id,
        name: name,
        selectedItem: '',
        type: 6,
        isTab: true,
        param: 'search_tab', // data.param || name,
        shared: 0,
        weight: 10,
        config: {
          ignoreMinSize: 'warning',
          maxrows: 5,
          columns: 5,
        },
      };
      if (data?.data) {
        dashboardData = data.data;
        dashboardData.id = dashboardData.alias = id;
        dashboardData.name = data.nameNewPanel;
        dashboardData.param = 'search_tab'
        //   data.param || data.nameNewPanel.toLowerCase();
      }
      // use this service to create new dashboard

      const res: any = await this.dashboardService
        .postDashboardStore(dashboardData.id, dashboardData)
        .toPromise();
      if (res && res.status === 'ok') {
        this.router.navigate([`/dashboard/${dashboardData.id}`]);
      }
      this.dashboardService.update();
      this.cdr.detectChanges();
    }
  }

  handleEnterKeyPress(event) {
    const tagName = event.target.tagName.toLowerCase();
    if (tagName !== 'textarea') {
      setTimeout(this.doSearchResult.bind(this), 100);
    }
    return false;
  }

  compareResultListItem(a: any, b: any) {
    if (b === null || b === undefined) {
      return false;
    }
    return a.id === b.id;
  }
  selectedStatusFn(item, selected) {
    if (selected.value && item.value) {
      return item.value === selected.value;
    }
    return false;
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
  }

  private get isLoki(): boolean {
    return this.fields.filter((i) => i.field_name === 'loki').length !== 0;
  }

  public getFields() {
    return Functions.cloneObject(this.fields);
  }

  addChip(event, item): void {
    const input = event.input;
    const value = event.value;
    const field_name = item.field_name;

    if ((value || '').trim()) {
      if (this.chipsObj[field_name]) {
        this.chipsObj[field_name].push({ val: value.trim() });
      }
    }
    if (input) {
      input.value = '';
    }
    this.fields.forEach((f) => {
      if (f.field_name === field_name && this.chipsObj[field_name]) {
        f.value = this.chipsObj[field_name].map((m) => m.val) || [];
      }
    });
    this.saveState();
    this.cdr.detectChanges();
  }

  removeChip(chip, selection): void {
    let index = 0;
    if (this.chipsObj[selection] && chip) {
      index = this.chipsObj[selection].indexOf(chip);
    }

    if (index >= 0 && this.chipsObj[selection]) {
      this.chipsObj[selection].splice(index, 1);
      this.fields.forEach((f) => {
        if (f.selection === selection && this.chipsObj[selection]) {
          f.value = this.chipsObj[selection].map((m) => m.val || []);
        }
      });
      this.saveState();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.subscriptionStorage) {
      this.subscriptionStorage.unsubscribe();
    }
    if (this.subscriptionStorage) {
      this.dashboardEventSubscriber.unsubscribe();
    }
  }
}
