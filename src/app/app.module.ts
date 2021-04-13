/* @angular */
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* @app */
import { JwtInterceptor, ErrorInterceptor } from '@app/helpers';
import { routing } from '@app/app.routing';
import { AppComponent } from '@app/app.component';
import { AppRoutingModule } from '@app/app-routing.module';
import { FilterPipe } from '@app/filter.pipe';
import { SafePipe } from '@app/safe.pipe';
import { HtmlPipe } from '@app/html.pipe';
import { MomentPipe } from './moment.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HepicMaterialModule } from '@app/app.material-module';
import {MatIconModule} from '@angular/material/icon';
/* @app/components */
// import * as components from '@app/components';
// import * as widgets from '@app/components/widgets';
// import * as dialogs from '@app/components/preference/dialogs';
// import * as dashboard from '@app/components/dashboard';
// import * as searchGridCall from '@app/components/search-grid-call';
import {
    AlertComponent,
    DashboardComponent,
    LoginComponent,
    ModalComponent,
    ModalResizableComponent,
    PreferenceComponent,
    SearchGridCallComponent,
    WindowComponent
} from '@app/components';
import {

    AceEditorWidgetComponent,
    ClockWidgetComponent,
    CodeStyleFieldComponent,
    CodeStylePrometheusFieldComponent,
    CodeStyleSmartInputFieldComponent,
    DialogAlarmComponent,
    DragDropListComponent,
    GeneralIframeWidgetComponent,
    IframeWidgetComponent,
    InfluxdbchartWidgetComponent,
    PrometheusWidgetComponent,
    ProtosearchWidgetComponent,
    PcapImportWidgetComponent,
    ResultChartWidgetComponent,
    ResultWidgetComponent,
    RsearchWidgetComponent,
    AlertWidgetComponent,
    SmartInputWidgetComponent,
    SettingClockWidgetComponent,
    SettingGeneralIframeWidgetComponent,
    SettingIframeWidgetComponent,
    SettingInfluxdbchartWidgetComponent,
    SettingPrometheusWidgetComponent,
    SettingPcapImportWidgetComponent,
    SettingProtosearchWidgetComponent,
    SettingResultChartWidgetComponent,
    SettingResultWidgetComponent,
    SettingsAceEditorWidgetComponent,
    SettingAlertWidgetComponent,
    SettingSmartInputWidgetComponent,

} from '@app/components/widgets';

import {
    DialogAdvancedComponent,
    DialogAgentsubComponent,
    DialogAliasComponent,
    DialogAuthKeyComponent,
    DialogAuthTokenDisplayComponent,
    DialogDeleteAlertComponent,
    DialogHepsubComponent,
    DialogMappingComponent,
    DialogUserSettingsComponent,
    DialogUsersComponent
} from '@app/components/preference/dialogs';
import {
    AddDashboardDialogComponent,
    AddDialogComponent,
    DeleteDialogComponent,
    EditDialogComponent
} from '@app/components/dashboard';
import {
    DialogSettingsGridDialog,
    LokiHighlightRenderer,
    ColumnActionRenderer,
    ColumnCallidRenderer,
    ColumnMethodRenderer,
    DetailDialogComponent,
    HeaderActionRenderer,
    MessageSafeHtmlPipe,
    MessageContentComponent,
    TabExportComponent,
    TabCallinfoComponent,
    TabFlowComponent,
    TabHepsubComponent,
    TabLogsComponent,
    TabLokiComponent,
    TabMessagesComponent,
    TabQosComponent,
    ExportDialogComponent
} from '@app/components/search-grid-call';

import { MenuComponent } from '@app/components/menu/menu.component';

/* other modules */
import { AgGridModule } from 'ag-grid-angular';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AceModule, ACE_CONFIG, AceConfigInterface } from 'ngx-ace-wrapper';
import { AceEditorModule } from 'ng2-ace-editor';
import { GridsterModule } from 'angular-gridster2';
import { DynamicModule } from 'ng-dynamic-component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartsModule } from 'ng2-charts';
import { MarkdownModule } from 'ngx-markdown';
import { ColorChromeModule } from 'ngx-color/chrome';
import { ColorCircleModule } from 'ngx-color/circle';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { FlowItemComponent } from './components/search-grid-call/detail-dialog/tab-flow/flow-item/flow-item.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
};

@NgModule({
    declarations: [
        AppComponent,
        MenuComponent,
        FilterPipe,
        SafePipe,
        HtmlPipe,
        MomentPipe,
        /** components */
        AlertComponent,
        DashboardComponent,
        LoginComponent,
        ModalComponent,
        ModalResizableComponent,
        PreferenceComponent,
        SearchGridCallComponent,
        WindowComponent,

        /** dashboard */
        AddDashboardDialogComponent,
        AddDialogComponent,
        DeleteDialogComponent,
        EditDialogComponent,

        /** searchGridCall */
        DialogSettingsGridDialog,
        LokiHighlightRenderer,
        ColumnActionRenderer,
        ColumnCallidRenderer,
        ColumnMethodRenderer,
        DetailDialogComponent,
        HeaderActionRenderer,
        MessageSafeHtmlPipe,
        MessageContentComponent,
        TabExportComponent,
        TabCallinfoComponent,
        TabFlowComponent,
        FlowItemComponent,
        TabHepsubComponent,
        TabLogsComponent,
        TabLokiComponent,
        TabMessagesComponent,
        TabQosComponent,
        ExportDialogComponent,

        /** widgets */
        AceEditorWidgetComponent,
        ClockWidgetComponent,
        CodeStyleFieldComponent,
        CodeStylePrometheusFieldComponent,
        CodeStyleSmartInputFieldComponent,
        DialogAlarmComponent,
        DragDropListComponent,
        GeneralIframeWidgetComponent,
        IframeWidgetComponent,
        InfluxdbchartWidgetComponent,
        PrometheusWidgetComponent,
        ProtosearchWidgetComponent,
        PcapImportWidgetComponent,
        ResultChartWidgetComponent,
        AlertWidgetComponent,
        ResultWidgetComponent,
        RsearchWidgetComponent,
        SmartInputWidgetComponent,
        SettingClockWidgetComponent,
        SettingGeneralIframeWidgetComponent,
        SettingIframeWidgetComponent,
        SettingInfluxdbchartWidgetComponent,
        SettingPrometheusWidgetComponent,
        SettingProtosearchWidgetComponent,
        SettingPcapImportWidgetComponent,
        SettingResultChartWidgetComponent,
        SettingResultWidgetComponent,
        SettingsAceEditorWidgetComponent,
        SettingAlertWidgetComponent,
        SettingSmartInputWidgetComponent,
        /** dialogs */
        DialogAdvancedComponent,
        DialogAgentsubComponent,
        DialogAliasComponent,
        DialogAuthKeyComponent,
        DialogAuthTokenDisplayComponent,
        DialogDeleteAlertComponent,
        DialogHepsubComponent,
        DialogMappingComponent,
        DialogUserSettingsComponent,
        DialogUsersComponent,

    ],
    // .concat(
        // Object.values<any>(dialogs),
        // Object.values<any>(widgets),
        // Object.values<any>(searchGridCall),
        // Object.values<any>(dashboard),
        // Object.values<any>(components)
    // ),
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        HttpClientModule,
        GridsterModule,
        ChartsModule,
        DynamicModule,
        routing,
        AppRoutingModule,
        HepicMaterialModule,
        MatIconModule,
        AgGridModule.withComponents([]),
        NgxDaterangepickerMd.forRoot(),
        NgxJsonViewerModule,
        AceModule,
        AceEditorModule,
        MarkdownModule.forRoot(),
        ColorChromeModule,
        ColorCircleModule,
        TableVirtualScrollModule
    ],
    entryComponents: [
        MenuComponent,

        /** dialogs */
        DialogAdvancedComponent,
        DialogAgentsubComponent,
        DialogAliasComponent,
        DialogAuthKeyComponent,
        DialogAuthTokenDisplayComponent,
        DialogDeleteAlertComponent,
        DialogHepsubComponent,
        DialogMappingComponent,
        DialogUserSettingsComponent,
        DialogUsersComponent,

        /** widgets */
        AceEditorWidgetComponent,
        ClockWidgetComponent,
        CodeStyleFieldComponent,
        CodeStylePrometheusFieldComponent,
        CodeStyleSmartInputFieldComponent,
        DialogAlarmComponent,
        DragDropListComponent,
        GeneralIframeWidgetComponent,
        IframeWidgetComponent,
        InfluxdbchartWidgetComponent,
        PrometheusWidgetComponent,
        ProtosearchWidgetComponent,
        PcapImportWidgetComponent,
        ResultChartWidgetComponent,
        ResultWidgetComponent,
        RsearchWidgetComponent,
        AlertWidgetComponent,
        SmartInputWidgetComponent,
        SettingClockWidgetComponent,
        SettingGeneralIframeWidgetComponent,
        SettingIframeWidgetComponent,
        SettingInfluxdbchartWidgetComponent,
        SettingPrometheusWidgetComponent,
        SettingProtosearchWidgetComponent,
        SettingPcapImportWidgetComponent,
        SettingResultChartWidgetComponent,
        SettingResultWidgetComponent,
        SettingsAceEditorWidgetComponent,
        SettingAlertWidgetComponent,
        SettingSmartInputWidgetComponent,
        /** dashboard */
        AddDashboardDialogComponent,
        AddDialogComponent,
        DeleteDialogComponent,
        EditDialogComponent

    ],
    // .concat(
    //     Object.values<any>(dialogs),
    //     Object.values<any>(widgets),
    //     Object.values<any>(dashboard)
    // ),
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: ACE_CONFIG, useValue: DEFAULT_ACE_CONFIG }
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }
