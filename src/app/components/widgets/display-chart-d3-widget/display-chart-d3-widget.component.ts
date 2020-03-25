import { Component, OnInit, Input, Output, ViewChild, EventEmitter, OnDestroy, AfterContentInit, OnChanges } from '@angular/core';
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

export class Tag {
  name: string;
  color: string;
  count: number;
}


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

@ViewChild('d3Chart', { static: true }) chart: D3PieChartComponent;
chartKeys: Tag[];

chartData: number[] = [];

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

Tags = {
  tagObj:[
    {
    count:0,
    color:'',
    name:'',
  }
]
}

@Input() id: string;
@Input() config: any;
@Output() changeSettings = new EventEmitter < any > ();

title: string;

_lastTimeStamp = 0;
set lastTimestamp(val: number) {
  this._lastTimeStamp = val;
}
get lastTimestamp() {
  return this._lastTimeStamp;
}

columnKeysGroupColumn;

localData: any;

protocol_profile

dataForChart

groupColumnAxis1: string;

noChartData: false;

isShowPanelSettings = true;

columnKeys = [];

keySelected = 'method';   //--- >  Key selected on the select of the chart

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


  const _f = Functions.cloneObject;
    if (this.config) {
      this.title = this.config.title || 'DISPLAY-CHART-D3';
      this.configQuery = _f(this.config.configQuery);
      this.groupColumnAxis1 = this.config.groupColumnAxis1;
      this.localData = _f(this.config.localData);
      this.isShowPanelSettings = this.config.isShowPanelSettings !== null ? this.config.isShowPanelSettings : true;
    }
    this.subsDashboardEvent = this._dashboardService.dashboardEvent.subscribe(this.onDashboardEvent.bind(this));
    this.subsCastRangeUpdateTimeOut = this._dateTimeRageService.castRangeUpdateTimeout.subscribe(this.getData.bind(this));
    this.getData();
  }
  ngAfterContentInit() {

    // here is where the chart is build first time
    this.buildD3Chart()
    
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
   this.getData();
  }

  isTimeStamp(n = null) {
    if (!n) {
      try {
        n = this.dataForChart[0][this.groupColumnAxis1];
      } catch (err) {
        return false;
      }
    }
    const m = (n + '').match(/\d{2}/g);
    if (m) {
      return +m[0] >= 15 && (n + '').length === 10;
    }
    return false;
  }

getChartData = (arr) => {
  let arrCount = [];
  arr.forEach( key=> {
    arrCount.push(key.count * 1 || 0)
  })
  return arrCount ;
}

getChartColors = (arr) => {
  let arrColors = [];
  arr.forEach( c => {
    arrColors.push(c.color)
  })
  return arrColors;
}

selectedKeys = (data, selected) =>{
  let keyArr = [];
  if(data){
    data.forEach(value => {
      if(value[selected].toString()===''){
        value[selected] = 'not set'
      }else{
        value[selected] = value[selected].toString()
      }
      keyArr.push(value[selected])
    })
  }
  return keyArr;
}

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

getTagCounts = (selectedKeyArr, tagsObj, keysSet) => {
  for(let i = 0 ; i < keysSet.length; i ++) {
    let tagsCount = selectedKeyArr.filter(el => el.indexOf(keysSet[i]) > -1).length;
    tagsObj[i].count = tagsCount *1 || 0;
    }
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
 
    this.selectedKeyArr = this.selectedKeys(this.dataForChart,this.keySelected)

    this.keysSet = Array.from(new Set(this.selectedKeyArr))

    this.colorScale =  this.getRandomColors(this.keysSet)
    
    this.Tags.tagObj = this.tagger(this.keysSet, this.selectedKeyArr);

    this.getTagCounts(this.selectedKeyArr, this.Tags.tagObj,this.keysSet);

    this.saveConfig();

    this.buildD3Chart();
  }
}

buildD3Chart() {

this.chartKeys = []; // use this reponse to test

let tagobject = this.Tags.tagObj;

tagobject.forEach((info) => {
  const target = new Tag();
  target.name = info.name;
  target.color = info.color;
  target.count = info.count;
  this.chartKeys.push(target);
});

this.chartData = [];

this.chartKeys.forEach((info) => {
  this.chartData.push(info.count);
  this.chart.data = [...this.chartData];
})

  
}


toggleData(event: MatSlideToggleChange) {
  this.chartControlsService.showData = event.checked;
}


private saveConfig() {
  const _f = Functions.cloneObject;
  this.config = {
    title: this.title || this.id,
    configQuery: _f(this.configQuery),
    groupColumnAxis1: this.groupColumnAxis1,
    localData: this.localData,
    isShowPanelSettings: this.isShowPanelSettings
  };

  this.changeSettings.emit({
    config: _f(this.config),
    id: this.id
  });
}

async openDialog() {
  const dialogRef = this.dialog.open(SettingDisplayChartD3WidgetComponent, {
    data: {
      title: this.title || this.id,
    }
  });

  const result = await dialogRef.afterClosed().toPromise();
  if (!result) {
    return;
  }

  this.title = result.title;

  this.saveConfig();
}

changeKey(e:any){
  this.keySelected = e.value;
  this.getData()
}
ngOnDestroy() {
  this.subsDashboardEvent.unsubscribe()
  this.subsCastRangeUpdateTimeOut.unsubscribe()
  }
}
