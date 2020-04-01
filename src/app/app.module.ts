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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HepicMaterialModule } from '@app/app.material-module';

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
    ResultChartWidgetComponent,
    ResultWidgetComponent,
    RsearchWidgetComponent,
    AlertWidgetComponent,
    SettingClockWidgetComponent,
    SettingGeneralIframeWidgetComponent,
    SettingIframeWidgetComponent,
    SettingInfluxdbchartWidgetComponent,
    SettingPrometheusWidgetComponent,
    SettingProtosearchWidgetComponent,
    SettingResultChartWidgetComponent,
    SettingResultWidgetComponent,
    SettingsAceEditorWidgetComponent,
    SettingAlertWidgetComponent,
   

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
    MessageContentComponent,
    TabExportComponent,
    TabFlowComponent,
    TabHepsubComponent,
    TabLogsComponent,
    TabLokiComponent,
    TabMessagesComponent,
    TabQosComponent
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

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
};

@NgModule({
    declarations: [
        AppComponent,
        MenuComponent,
        FilterPipe,
        SafePipe,
        HtmlPipe,
        
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
        MessageContentComponent,
        TabExportComponent,
        TabFlowComponent,
        TabHepsubComponent,
        TabLogsComponent,
        TabLokiComponent,
        TabMessagesComponent,
        TabQosComponent,

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
        ResultChartWidgetComponent,
    
        ResultWidgetComponent,
        RsearchWidgetComponent,
        SettingClockWidgetComponent,
        SettingGeneralIframeWidgetComponent,
        SettingIframeWidgetComponent,
        SettingInfluxdbchartWidgetComponent,
        SettingPrometheusWidgetComponent,
        SettingProtosearchWidgetComponent,
        SettingResultChartWidgetComponent,
        SettingResultWidgetComponent,
        SettingsAceEditorWidgetComponent,
    
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
        DynamicModule.withComponents([]),
        routing,
        AppRoutingModule,
        HepicMaterialModule,
        AgGridModule.withComponents([]),
        NgxDaterangepickerMd.forRoot(),
        NgxJsonViewerModule,
        AceModule,
        AceEditorModule,
        MarkdownModule.forRoot(),
        ColorChromeModule,
        ColorCircleModule
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
        ResultChartWidgetComponent,
        ResultWidgetComponent,
        RsearchWidgetComponent,
        AlertWidgetComponent,
        SettingClockWidgetComponent,
        SettingGeneralIframeWidgetComponent,
        SettingIframeWidgetComponent,
        SettingInfluxdbchartWidgetComponent,
        SettingPrometheusWidgetComponent,
        SettingProtosearchWidgetComponent,
        SettingResultChartWidgetComponent,
        SettingResultWidgetComponent,
        SettingsAceEditorWidgetComponent,
        SettingAlertWidgetComponent,

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
