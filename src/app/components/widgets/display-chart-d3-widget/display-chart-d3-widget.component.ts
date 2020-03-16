import { Component, OnInit, Input, Output, ViewChild, EventEmitter, OnDestroy, AfterContentInit } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { SettingDisplayChartD3WidgetComponent } from './setting-display-chart-d3-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DashboardService, PreferenceMappingProtocolService,SearchCallService, DateTimeRangeService, MappingService } from '@app/services';
import { Subscription } from 'rxjs';
import { ConstValue } from '@app/models';
import { Functions } from '@app/helpers/functions';
import * as moment  from 'moment';
import { D3PieChartComponent } from './d3-pie-chart/d3-pie-chart.component';
import { ChartControlsService } from './chart-controls.service';

interface DataColumn {
  value: string;
  id: number;
  name: string;
}

export class SIPMethod {
  method: string;
  methodDisplayValue: string;
  count: number;
}

export class Tag {
  name: string;
  color: string;
  count: number;
}

type SortType = 'SUM';

@Component({
  selector: 'app-display-chart-d3',
  templateUrl: './display-chart-d3-widget.component.html',
  styleUrls: ['./display-chart-d3-widget.component.scss']
})

@Widget({
  title: 'Display Chart D3',
  description: 'Display the search in D3 chart',
  category: 'Visualize',
  indexName: 'display-chart-d3',
  className: 'DisplayChartD3WidgetComponent' // <-- the same name as class name
})

export class DisplayChartD3WidgetComponent implements IWidget {

@ViewChild('ordersByStatusChart', { static: true }) chart: D3PieChartComponent;
sipMethods: SIPMethod[];
chartKeys: Tag[];
chartData: number[] = [];
Tags = [];
labels = ['100', '101', '200', '407', 'ACK', 'INVITE', 'BYE'];

chartDataObj = {

    "sipMethods":[

    {
      "method": "m_100",
      "methodDisplayValue": "100",
      "count": 0
    },
    {
      "method": "m_101",
      "methodDisplayValue": "101",
      "count": 0
    },
    {
      "method": "m_200",
      "methodDisplayValue": "200",
      "count": 0
    },
    {
      "method": "m_403",
      "methodDisplayValue": "403",
      "count": 0
    },
    {
      "method": "m_407",
      "methodDisplayValue": "407",
      "count": 0
    },
    {
      "method": "m_ACK",
      "methodDisplayValue": "ACK",
      "count": 0
    },
    {
      "method": "m_INVITE",
      "methodDisplayValue": "INVITE",
      "count": 0
    },
    {
      "method": "m_BYE",
      "methodDisplayValue": "BYE",
      "count": 0
    }

  ]
}

methodDisplayValues = this.chartDataObj.sipMethods.map(m => m.methodDisplayValue);
displayedColumns = ['legend', 'SIPMethod', 'count'];

refreshInterval;

@Input() id: string;
@Input() config: any;
@Output() changeSettings = new EventEmitter < any > ();

title: string;

configQuery = {
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

_lastTimeStamp = 0;
set lastTimestamp(val: number) {
  this._lastTimeStamp = val;
}
get lastTimestamp() {
  return this._lastTimeStamp;
}

columnKeysGroupColumn;

localData: any;

comingRequest

protocol_profile

dataForChart

sortType: SortType = 'SUM';

_isLoaded = true;

isFormattedDateTime = true;

dataColumns: Array < DataColumn > = [];

groupColumnAxis1: string;

noChartData: false;

numberTypes: 'short';

isShowPanelSettings = true;

columnKeys = [];

keySelected = '';   //--- >  Key selected on the select of the chart

keysSet = [];

colorScale = [];

selectedKeyArr = [];

subsDashboardEvent: Subscription;

subsCastRangeUpdateTimeOut: Subscription;

  constructor(
    public dialog: MatDialog,
    private _dashboardService : DashboardService,
    private _prefMapProtoService : PreferenceMappingProtocolService,
    private _srcCallService : SearchCallService,
    private _dateTimeRageService : DateTimeRangeService,
    public chartControlsService: ChartControlsService) { 
    this.chartControlsService.fullScreen = false;
  }

  ngOnInit() {
    WidgetArrayInstance[this.id] = this as IWidget; 
    this.keySelected = 'method';
    this.config = {
      name: 'display-chart-d3',
      configQuery: this.configQuery
    }
    if (!this.configQuery) {
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

    this.dataColumns = [{
      value: '',
      id: 0,
      name: 'A'
    }];

    const _f = Functions.cloneObject;
    if (this.config) {
      this.title = this.config.title || 'DISPLAY-CHART-D3';
      this.configQuery = _f(this.config.configQuery);
      this.groupColumnAxis1 = this.config.groupColumnAxis1;
      this.dataColumns = _f(this.config.dataColumns);
      this.localData = _f(this.config.localData);
      this.sortType = this.config.sortType || this.sortType;
      this.isShowPanelSettings = this.config.isShowPanelSettings !== null ? this.config.isShowPanelSettings : true;
    }
    this.subsDashboardEvent = this._dashboardService.dashboardEvent.subscribe(this.onDashboardEvent.bind(this));
    this.subsCastRangeUpdateTimeOut = this._dateTimeRageService.castRangeUpdateTimeout.subscribe(this.getData.bind(this));
  }

  private async onDashboardEvent(data: any) {
    const dataId = data.resultWidget[this.id];
    if (dataId && dataId.query) {
      if (this.lastTimestamp * 1 === dataId.timestamp * 1) {
        return;
      }

      this.lastTimestamp = dataId.timestamp * 1;

      this.localData = dataId.query;
    }
    //this.getData();

  }

private async getData() {
  if (!this.localData) {
    return;
  }

  this.protocol_profile = this.localData.protocol_id;
  if (this.localData.location && this.localData.location.value !== '' && this.localData.location.mapping !== '') {
    this.configQuery.param.location[this.localData.location.mapping] = this.localData.location.value;
  }

  this.configQuery.param.search[this.protocol_profile] = this.localData.fields;
  this.configQuery.timestamp = this._dateTimeRageService.getDatesForQuery(true);
  const dataMapping: any = await this._prefMapProtoService.getAll().toPromise();
  const result = await this._srcCallService.getData(this.configQuery).toPromise();
  const dataMappingItem = dataMapping.data.filter(i => i.profile === this.protocol_profile.split('_')[1])[0];

  if (dataMappingItem && dataMappingItem.fields_mapping) {
    const fields_mapping = dataMappingItem.fields_mapping;
    this.columnKeysGroupColumn = result.keys;
    this.columnKeys = fields_mapping.filter(i => i.type !== 'string').map(i => i.id.split('.')[1]);
    this.dataForChart = result.data;
    if(this.dataForChart){
      this.saveConfig();
      this.buildD3Chart();
    }
  
   
  }
}

// array of numbers for the chart
getChartData = (arr) => {
  let arrCount = [];
  arr.forEach( key=> {
    arrCount.push(key.count)
  })
  console.log(arrCount)
  return arrCount;
}

// array of colors for the chart
getChartColors = (arr) => {
  let arrColors = [];
  arr.forEach( c => {
    arrColors.push(c.color)
  })
  return arrColors;
}

// raw array of entries of selected key
selectedKeys = (data, selected) =>{

  let keyArr = [];
  data.forEach(value => {
    if(value[selected].toString()===''){
      value[selected] = 'not set'
    }else{
      value[selected] = value[selected].toString()
    }
    keyArr.push(value[selected])
  })
  return keyArr;
}

// build and array of (n) number colors
getRandomColors(n){
  let colorsArray = [];
  for(let i = 0 ; i < n.length; i ++){
  let letters = '0123456789abcdef';
  let color = '#';
  for(let j = 0 ; j < 6; j++){
    color +=letters[Math.floor(Math.random()*16)];
  }
  colorsArray.push(color);
}
return colorsArray;
}

// kS = keysSet   kA = keysArray : selectedKeyArray inside build D3Chart ... make new var!
// kA stands for keysArray = selectedKeyArray // kS = keysSet
tagger = (kS, kA) => {
let tagArr = [];
for(let i = 0 ; i < kS.length; i++){
  let keysCount = kA.filter(el => el.indexOf(kS[i])> -1).length;
  let tag = new Tag();
  tag.count = keysCount;
  tag.color = this.colorScale[i];
  if(this.keysSet[i]===''){
    tag.name ='not set'
  }else{
    tag.name = this.keysSet[i];
  }
  
  tagArr.push(tag);
  }
 
  return tagArr;
  
}

/* method for building the D3 Chart */

async buildD3Chart() {


this.keySelected

  this.selectedKeyArr = this.selectedKeys(this.dataForChart,this.keySelected) 

  this.keysSet = Array.from(new Set(this.selectedKeyArr))
 
  this.colorScale = this.getRandomColors(this.keysSet)
  this.Tags = this.tagger(this.keysSet, this.selectedKeyArr);
  console.log(this.Tags[0].count);
  
  this.chartKeys = [];
   
  //this.chart.data = [...this.chartData];

  this.chartData = [];

  this.chartData = this.getChartData(this.Tags);

  console.log(this.chartData);
  
}

/* switch for showing the data */

toggleData(event: MatSlideToggleChange) {
  this.chartControlsService.showData = event.checked;
}


/* save the actual config */

private saveConfig() {
  const _f = Functions.cloneObject;
  this.config = {
    title: this.title || this.id,
    configQuery: _f(this.configQuery),
    groupColumnAxis1: this.groupColumnAxis1,
    dataColumns: _f(this.dataColumns),
    localData: this.localData,
    sortType: this.sortType,
    isShowPanelSettings: this.isShowPanelSettings
  };

  this.changeSettings.emit({
    config: _f(this.config),
    id: this.id
  });
}

/* open the settings dialog */

async openDialog() {
  const dialogRef = this.dialog.open(SettingDisplayChartD3WidgetComponent, {
    data: {
      title: this.title || this.id,
      sortType: this.sortType
    }
  });

  const result = await dialogRef.afterClosed().toPromise();
  if (!result) {
    return;
  }
  this.sortType = result.sortType;
  this.title = result.title;

  //this.getData()
  //this.buildD3Chart();
  //this.saveConfig();
}

/* generate the chart after all the data is set */

ngAfterContentInit() {
  this.getData()
}

/* unsubscribe from services after dropping widget */

ngOnDestroy() {
  this.subsDashboardEvent.unsubscribe()
  this.subsCastRangeUpdateTimeOut.unsubscribe()
  }
}
