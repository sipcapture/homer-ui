How to CREATE NEW WIDGET ?
==========================

Folder for all widgets is:
```
./src/app/components/widgets
```

example widget component `./my-widget/my-widget.conmponent.ts`:
```js
import { Component, Input } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';

import { SettingMyWidgetComponent } from './setting-my-widget.component';

@Component({
    selector: 'app-my-widget',
    template: `
        <h1> My Widget </h1>
        <p>{{ config.name }}</p>
    `
})
/**
 * this decorator register a widget in project
 */
@Widget({
    title: 'My Widget',
    description: 'Widget Description',
    category: 'My Category',
    indexName: 'my-widget',
    className: 'MyWidgetComponent' // <-- the same name as class name
})
/* ... implements IWidget - very IMPORTANT !!! */
export class MyWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings = new EventEmitter<any> ();

    constructor() { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget; // <--- IMPORTANT: SHOULD TO BE
        /* this.config - is JSON config for each widget instance, saves on dashboard  */
        if (!this.config) {
            this.config = {
                /* some widget data */
                title: 'default Title'
            }
        }
    }
    openDialog () { 
        /* open dialod settings for this wiget */
        const dialogRef = this.dialog.open(SettingMyWidgetComponent, {
            data: this.config || {empty: true}
        });
        const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
            if (result) {

                this.config.title = result.title;

                /* update config for widget instance */
                this.changeSettings.emit({ config: this.config, id: this.id });
            }
            dialogRefSubscription.unsubscribe();
        })
    }
    ngOnDestroy() { }
}

```

example setting dialog for widget component `./my-widget/setting-my-widget.conmponent.ts`:

```js
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-my-clock-widget-component',
    template: `
        <mat-toolbar class="title" color="primary">
            <div>Settings</div>
            <button mat-icon-button (click)="onNoClick()">
                <mat-icon>close</mat-icon>
            </button>
        </mat-toolbar>

        <div mat-dialog-content>
            <mat-form-field>
                <mat-label>Title</mat-label>
                <input matInput [(ngModel)]="data.title">
            </mat-form-field>
        </div>
     
        <div mat-dialog-actions style="float: right; margin-bottom: 0rem;">
            <button mat-raised-button (click)="onNoClick()">Cancel</button>
            <button mat-raised-button color="primary" [mat-dialog-close]="data" cdkFocusInitial>Ok</button>
        </div>
    `,
    styleUrls: ['./my-clock-widget.component.css']
})

export class SettingMyWidgetComponent {
    
    constructor(
        public dialogRef: MatDialogRef<SettingMyWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

```

be sure to have your widget and settings widget in the correct order in file `./src/app/app.module.ts`

```js
...
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
        /* my widget component */
        MyWidgetComponent,
        SettingClockWidgetComponent,
        SettingGeneralIframeWidgetComponent,
        SettingIframeWidgetComponent,
        SettingInfluxdbchartWidgetComponent,
        SettingPrometheusWidgetComponent,
        SettingProtosearchWidgetComponent,
        SettingResultChartWidgetComponent,
        SettingResultWidgetComponent,
        SettingsAceEditorWidgetComponent,
        /* my widget settings */
        SettingMyWidgetComponent,
...
```

last step, write paths in file `./src/app/components/widgets/index.ts` :
```js
...

/* my widget */
export * from './my-widget/my-widget.component';

/* settings dialog for my-widget */
export * from './my-widget/setting-my-widget.component';

...
```

finally, run project from console:
```bach
$ ng serve 

```

USEFUL SERVICES
==========================

Use the services 

- for getting the data from the search : ``SearchCallService`` 
- for listening on the events of the dashboard: ``DashboardService`` 
- for getting the Protocol Mapping preferences: ``PreferenceMappingProtocolService`` 
- for getting the Time Range selected: ``DateTimeRangeService`` 

## Examples of use 

Some examples of use for the Services

```js
...
/* first define a config query */

 this.configQuery = {
        param: {
          transaction: {},
          limit: 200,
          search: {},
          location: {},
          timezone: {
          value: -180,
          name: 'Local'
          }
        },
        timestamp: {
          from: 0,
          to: 0
        }
      };
    }

/* define the params of the configQuery getting them from the services and the local storage */

  this.protocol_profile = this.localData.protocol_id;
  if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
    this.configQuery.param.location[this.localData.location.mapping] = this.localData.location.value;
  }

  this.configQuery.param.search[this.protocol_profile] = this.localData.fields;
  /* use the DateTimeRangeService for getting the timestamp */
  this.configQuery.timestamp = this._dateTimeRageService.getDatesForQuery(true);
  /* use the PreferenceMappingProtocolService */
  const dataMapping: any = await this._preferenceMappingProtocolService.getAll().toPromise();
  /* use the SearchCallService for getting the data form the Proto Search widget */

  const result = await this._searchCallService.getData(this.configQuery).toPromise();

  const dataMappingItem = dataMapping.data.filter(i => i.profile === this.protocol_profile.split('_')[1])[0];

  if (dataMappingItem && dataMappingItem.fields_mapping) {
    const fields_mapping = dataMappingItem.fields_mapping;
    this.columnKeysGroupColumn = result.keys;
    this.columnKeys = fields_mapping.filter(i => i.type !== 'string').map(i => i.id.split('.')[1]);
    this.searchData = result.data; // get the search result for getting the data
  }
...
```

## Important
For sending the search results from the Proto Search Widget, in file: 
``src/app/components/widgets/protosearch-widget/protosearch-widget.component.ts`` 
you must edit the Types in the Proto Search component as below: 

```js
...

        this.dashboardEventSubscriber = this._ds.dashboardEvent.subscribe( (data: DashboardEventData) => {
            this.widgetResultList = data.currentWidgetList
                .filter(i => i.name === 'result' || i.name === 'display-results-chart' || i.name  === 'my-widget' ) /* the indexName of your widget */
                .map( i => ({
                    id : i.id,
                    title: i.config ? i.config.title : i.id,
                    type: 'widget'
                }));
            this.widgetResultList.push({
                id: 'Default',
                title: 'Default',
                type: 'page'
            });
...
```