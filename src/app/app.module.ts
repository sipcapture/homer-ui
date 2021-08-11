import { CustomAgGridModule } from './components/controls/custom-ag-grid/custom-ag-grid.module';
import { WebsharkModule } from './components/controls/webshark/webshark.module';
import { LokiResultsModule } from './components/controls/loki-results/loki-results.module';
import { FullScreenComponent } from './components/controls/full-screen/full-screen.component';
import { TransactionFilterService } from '@app/components/controls/transaction-filter/transaction-filter.service';
import { TabGraphModule } from '@app/components/search-grid-call/detail-dialog/tab-graph/tab-graph.module';
import { MessageContentModule } from './components/search-grid-call/message-content/message-content.module';
import { TabTimelineModule } from './components/search-grid-call/detail-dialog/tab-timeline/tab-timeline.module';
import { TabRecordingModule } from './components/search-grid-call/detail-dialog/tab-recording/tab-recording.module';
import { TabSubModule } from './components/search-grid-call/detail-dialog/tab-sub/tab-sub.module';
import { TabTdrModule } from './components/search-grid-call/detail-dialog/tab-tdr/tab-tdr.module';
import { TabMessagesModule } from './components/search-grid-call/detail-dialog/tab-messages/tab-messages.module';
import { TabMediaReportsModule } from './components/search-grid-call/detail-dialog/tab-media-reports/tab-media-reports.module';
import { CodeStyleFieldModule } from './components/widgets/rsearch-widget/code-style-field/code-style-field.module';
import { TabHepsubModule } from './components/search-grid-call/detail-dialog/tab-hepsub/tab-hepsub.module';
import { TabGeoModule } from './components/search-grid-call/detail-dialog/tab-geo/tab-geo.module';
import { ModalResizableModule } from './components/controls/modal-resizable/modal-resizable.module';
import { TransactionFilterModule } from './components/controls/transaction-filter/transaction-filter.module';
import { TransactionInfoModule } from './components/controls/transaction-info/transaction-info.module';
import { FlowTooltipModule } from './components/controls/flow-tooltip/flow-tooltip.module';
import { CustomTableModule } from './components/controls/custom-table/custom-table.module';
import { AlertModule } from '@app/components/controls/alert/alert.module';
import { TabCallinfoModule } from './components/search-grid-call/detail-dialog/tab-callinfo/tab-callinfo.module';
import { TabDtmfModule } from './components/search-grid-call/detail-dialog/tab-dtmf/tab-dtmf.module';
import { TabEventsModule } from './components/search-grid-call/detail-dialog/tab-events/tab-events.module';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
/* @angular */
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClientJsonpModule, HttpClient } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayModule } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
/* @app */
import { JwtInterceptor, ErrorInterceptor } from '@app/helpers';
import { routing } from '@app/app.routing';
import { AppComponent } from '@app/app.component';
import { AppRoutingModule } from '@app/app-routing.module';
import { FilterPipe } from '@app/pipes/filter.pipe';
import { SafePipe } from '@app/pipes/safe.pipe';
import { ColorOffsetModule } from '@app/pipes/colorOffset.module';

import { HtmlPipe } from '@app/pipes/html.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomerMaterialModule } from '@app/app.material-module';
// import { MatIconModule } from '@angular/material/icon';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgSelectFormFieldControlDirective } from './helpers/ng-multiselect.directive';

import {
  DashboardComponent,
  LoginComponent,
  PreferenceComponent,
  SearchGridCallComponent
} from '@app/components';

import {
  AceEditorWidgetComponent,
  ClockWidgetComponent,
  CodeStylePrometheusFieldComponent,
  CodeStyleSmartInputFieldComponent,
  CodeProtoSelectorComponent,
  DialogAlarmComponent,
  DragDropListComponent,
  ChipsInputComponent,
  GeneralIframeWidgetComponent,
  IframeWidgetComponent,
  InfluxdbchartWidgetComponent,
  ClickhouseChartWidgetComponent,
  PrometheusWidgetComponent,
  ProtosearchWidgetComponent,
  ResultChartWidgetComponent,
  ResultWidgetComponent,
  RsearchWidgetComponent,
  SmartInputWidgetComponent,
  PcapUploaderWidgetComponent,

  SettingClockWidgetComponent,
  SettingGeneralIframeWidgetComponent,
  SettingIframeWidgetComponent,
  SettingInfluxdbchartWidgetComponent,
  SettingClickhouseChartWidgetComponent,
  SettingPrometheusWidgetComponent,
  SettingProtosearchWidgetComponent,
  SettingResultChartWidgetComponent,
  SettingResultWidgetComponent,
  SettingsAceEditorWidgetComponent,
  SettingSmartInputWidgetComponent,
  AlertWidgetComponent
} from '@app/components/widgets';

import {
  DialogAdvancedComponent,
  DialogAgentsubComponent,
  DialogAliasComponent,
  DialogIpAliasComponent,
  DialogAuthKeyComponent,
  DialogAuthTokenDisplayComponent,
  DialogDeleteAlertComponent,
  DialogHepsubComponent,
  DialogMappingComponent,
  DialogUserSettingsComponent,
  DialogUsersComponent,
  DialogScriptsComponent,
  DialogInterceptionsComponent,
  DialogDBSelectorComponent
} from '@app/components/preference/dialogs';
import {
  PageAboutComponent,
  PageAdvancedSettingsComponent,
  PageAgentSubscriptionsComponent,
  PageApiAuthComponent,
  PageApiDocComponent,
  PageHepsubComponent,
  PageInterceptionsComponent,
  PageIpAliasComponent,
  PageMappingComponent,
  PageResetComponent,
  PageScriptsComponent,
  PageSystemOverviewComponent,
  PageUserSettingsComponent,
  PageUsersComponent,
  PageAdminComponent,
  PageAliasComponent
} from '@app/components/preference/pages';
import {
  AddDashboardDialogComponent,
  AddDialogComponent,
  DeleteDialogComponent,
  EditDialogComponent,
  ShareQrDialogComponent,
  UrlWarningDialog
} from '@app/components/dashboard';
import {
  DialogSettingsGridDialog,
  ExportDialogComponent,
  DialogChartGridDialogComponent,
  LokiHighlightRenderer,
  ColumnActionRenderer,
  ColumnAliasRenderer,
  ColumnCallidRenderer,
  ColumnUuidRenderer,
  ColumnMethodRenderer,
  ColumnMOSRenderer,
  ColumnCountryRenderer,
  DetailDialogComponent,
  HeaderActionRenderer,
  GenericCellRenderer,
  TabExportComponent
} from '@app/components/search-grid-call';

import {
  StatusFilterComponent
} from '@app/components/search-grid-call/filters';

import { MenuComponent } from '@app/components/menu/menu.component';

/* other modules */
import { AgGridModule } from 'ag-grid-angular';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AceModule, ACE_CONFIG, AceConfigInterface } from 'ngx-ace-wrapper';
import { MatColorFormats, MAT_COLOR_FORMATS, NgxMatColorPickerModule } from '@angular-material-components/color-picker';
import { AceEditorModule } from 'ng2-ace-editor';
import { GridsterModule } from 'angular-gridster2';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { DynamicModule } from 'ng-dynamic-component';
import { ChartsModule } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { GoogleMapsModule } from '@angular/google-maps'; // temporary reverted to maplibre

import { NgxDaterangepickerMd } from './components/controls/daterangepicker';
import { SettingAlertWidgetComponent } from './components/widgets/alert-widget/setting-alert-widget.component';
import { UpdateAlertComponent } from './components/controls/update-alert/update-alert.component';
import {
  NgxMatDatetimePickerModule,
  NgxMatNativeDateModule,
  NgxMatTimepickerModule,
} from '@angular-material-components/datetime-picker';
import {
  DialogExportComponent,
  DialogImportComponent
} from './components/preference/service-dialogs';
import { TabFlowModule } from './components/search-grid-call/detail-dialog/tab-flow/tab-flow.module';
import { HepTooltipModule } from './hep-tooltip/hep-tooltip.module';
import { PreferencesPipe } from './pipes/preferences.pipe';
const DEFAULT_ACE_CONFIG: AceConfigInterface = {
};


import { PreferencesContentMapping } from './models/preferences-kw-mapping';
import { DialogPasswordResetComponent } from './components/login/password-reset-dialog/dialog-password-reset.component';
import {
  GenericCellComponent,
  ToolCellComponent,
  ActiveCellComponent,
  DataCellComponent,
  LastErrorCellComponent,
  DbStatsCellComponent
} from './components/preference/cell-types';
import { SettingButtonComponent } from './components/preference/setting-button/setting-button.component';
import { LoadingCircleComponent } from './components/controls/loading-circle/loading-circle.component';
import { TranslateModule, TranslateLoader, TranslateCompiler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLinkCompiler } from './helpers/translate-link-complier';
import { TransactionGraphSettingsComponent } from './components/controls/transaction-graph-settings/transaction-graph-settings.component';
import { CopyComponent } from './components/controls/copy/copy.component';
import { CopyModule } from './components/controls/copy/copy.module';
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}
export const CUSTOM_MAT_COLOR_FORMATS: MatColorFormats = {
  display: {
    colorInput: 'hex'
  }
};
@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    FilterPipe,
    SafePipe,
    HtmlPipe,
    PreferencesPipe,
    NgSelectFormFieldControlDirective,

    /** components */
    DashboardComponent,
    LoginComponent,
    DialogPasswordResetComponent,
    PreferenceComponent,
    SearchGridCallComponent,
    PageApiDocComponent,

    /** dashboard */
    AddDashboardDialogComponent,
    AddDialogComponent,
    DeleteDialogComponent,
    EditDialogComponent,
    ShareQrDialogComponent,
    UrlWarningDialog,

    /** searchGridCall */
    DialogSettingsGridDialog,
    ExportDialogComponent,
    DialogChartGridDialogComponent,
    LokiHighlightRenderer,
    ColumnActionRenderer,
    ColumnAliasRenderer,
    ColumnCallidRenderer,
    ColumnUuidRenderer,
    ColumnMethodRenderer,
    ColumnMOSRenderer,
    ColumnCountryRenderer,
    DetailDialogComponent,
    HeaderActionRenderer,
    GenericCellRenderer,
    TabExportComponent,
    StatusFilterComponent,

    /** widgets */
    AceEditorWidgetComponent,
    ClockWidgetComponent,
    CodeStylePrometheusFieldComponent,
    CodeStyleSmartInputFieldComponent,
    CodeProtoSelectorComponent,
    DialogAlarmComponent,
    DragDropListComponent,
    ChipsInputComponent,
    GeneralIframeWidgetComponent,
    IframeWidgetComponent,
    InfluxdbchartWidgetComponent,
    ClickhouseChartWidgetComponent,
    PrometheusWidgetComponent,
    ProtosearchWidgetComponent,
    ResultChartWidgetComponent,
    ResultWidgetComponent,
    RsearchWidgetComponent,
    SmartInputWidgetComponent,
    PcapUploaderWidgetComponent,
    SettingClockWidgetComponent,
    SettingGeneralIframeWidgetComponent,
    SettingIframeWidgetComponent,
    SettingInfluxdbchartWidgetComponent,
    SettingClickhouseChartWidgetComponent,
    SettingPrometheusWidgetComponent,
    SettingProtosearchWidgetComponent,
    SettingResultChartWidgetComponent,
    SettingResultWidgetComponent,
    SettingsAceEditorWidgetComponent,
    SettingSmartInputWidgetComponent,
    AlertWidgetComponent,

    /** dialogs */
    DialogAdvancedComponent,
    DialogAgentsubComponent,
    DialogAliasComponent,
    DialogIpAliasComponent,
    DialogAuthKeyComponent,
    DialogAuthTokenDisplayComponent,
    DialogDeleteAlertComponent,
    DialogHepsubComponent,
    DialogMappingComponent,
    DialogUserSettingsComponent,
    DialogUsersComponent,
    DialogScriptsComponent,
    DialogInterceptionsComponent,
    DialogDBSelectorComponent,
    SettingAlertWidgetComponent,
    UpdateAlertComponent,
    DialogExportComponent,
    DialogImportComponent,
    FullScreenComponent,

    /** Preference pages */
    PageIpAliasComponent,

    /**Cell types */
    GenericCellComponent,
    ToolCellComponent,
    ActiveCellComponent,
    DataCellComponent,
    LastErrorCellComponent,
    DbStatsCellComponent,
    SettingButtonComponent,
    PageUsersComponent,
    PageUserSettingsComponent,
    PageAdvancedSettingsComponent,
    PageMappingComponent,
    PageInterceptionsComponent,
    PageScriptsComponent,
    PageAgentSubscriptionsComponent,
    PageApiAuthComponent,
    PageHepsubComponent,
    PageResetComponent,
    PageAboutComponent,
    PageAdminComponent,
    PageAliasComponent,
    LoadingCircleComponent,
    PageSystemOverviewComponent,
    TransactionGraphSettingsComponent,
  ],

  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    HttpClientJsonpModule,
    GridsterModule,
    ChartsModule,
    DynamicModule,
    routing,
    AppRoutingModule,
    HomerMaterialModule,
    // MatIconModule,
    Ng2SearchPipeModule,
    NgSelectModule,
    OverlayModule,
    NoopAnimationsModule,
    AgGridModule.withComponents([]),
    NgxJsonViewerModule,
    NgxQRCodeModule,
    AceModule,
    AceEditorModule,
    FontAwesomeModule,
    MarkdownModule.forRoot(),
    NgxDaterangepickerMd.forRoot(),
    NgxMatColorPickerModule,
    AgChartsAngularModule,
    VirtualScrollerModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    GoogleMapsModule, // temporary reverting to maplibre
    HepTooltipModule,
    TabFlowModule,
    TabEventsModule,
    TabDtmfModule,
    TabCallinfoModule,
    AlertModule,
    CustomTableModule,
    FlowTooltipModule,
    TransactionFilterModule,
    TransactionInfoModule,
    ModalResizableModule,
    TabGeoModule,
    TabHepsubModule,
    CodeStyleFieldModule,
    TabMediaReportsModule,
    TabMessagesModule,
    TabTdrModule,
    TabSubModule,
    TabRecordingModule,
    TabTimelineModule,
    TabGraphModule,
    MessageContentModule,
    LokiResultsModule,
    WebsharkModule,
    CopyModule,
    CustomAgGridModule,
    ColorOffsetModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      compiler: {
        useClass: TranslateLinkCompiler,
        provide: TranslateCompiler
      }
    })
  ],
  entryComponents: [
    MenuComponent,

    /** dialogs */
    DialogAdvancedComponent,
    DialogAgentsubComponent,
    DialogAliasComponent,
    DialogIpAliasComponent,
    DialogAuthKeyComponent,
    DialogAuthTokenDisplayComponent,
    DialogDeleteAlertComponent,
    DialogHepsubComponent,
    DialogMappingComponent,
    DialogUserSettingsComponent,
    DialogUsersComponent,
    DialogScriptsComponent,
    DialogDBSelectorComponent,

    /** widgets */
    AceEditorWidgetComponent,
    ClockWidgetComponent,
    CodeStylePrometheusFieldComponent,
    CodeStyleSmartInputFieldComponent,
    CodeProtoSelectorComponent,
    DialogAlarmComponent,
    DragDropListComponent,
    GeneralIframeWidgetComponent,
    IframeWidgetComponent,
    InfluxdbchartWidgetComponent,
    ClickhouseChartWidgetComponent,
    PrometheusWidgetComponent,
    ProtosearchWidgetComponent,
    ResultChartWidgetComponent,
    ResultWidgetComponent,
    RsearchWidgetComponent,
    SmartInputWidgetComponent,
    PcapUploaderWidgetComponent,
    AlertWidgetComponent,
    SettingClockWidgetComponent,
    SettingGeneralIframeWidgetComponent,
    SettingIframeWidgetComponent,
    SettingInfluxdbchartWidgetComponent,
    SettingClickhouseChartWidgetComponent,
    SettingPrometheusWidgetComponent,
    SettingProtosearchWidgetComponent,
    SettingResultChartWidgetComponent,
    SettingResultWidgetComponent,
    SettingsAceEditorWidgetComponent,
    SettingSmartInputWidgetComponent,
    SettingAlertWidgetComponent,
    PageApiDocComponent,

    /** dashboard */
    AddDashboardDialogComponent,
    AddDialogComponent,
    DeleteDialogComponent,
    EditDialogComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: ACE_CONFIG, useValue: DEFAULT_ACE_CONFIG },
    { provide: MAT_COLOR_FORMATS, useValue: CUSTOM_MAT_COLOR_FORMATS },
    { provide: PreferencesContentMapping, useClass: PreferencesContentMapping },
    TransactionFilterService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fab, far);
  }
}
