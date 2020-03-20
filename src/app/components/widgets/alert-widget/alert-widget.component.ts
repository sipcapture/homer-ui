import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, Injectable } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget.ts';
import { SettingAlertWidgetComponent } from './setting-alert-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs";
import { IWidget } from '../IWidget';

export interface AlertConfig {
    id?: string;
    title: string;
    alertState: boolean;
    alertUrl: string;
    audioUrl: string;
    requestType: string;
    keyList: Array<string>;
    valueList: Array<string>;
    expectedList: Array<string>;
    comparsionTypeList: Array<string>;
}


@Component({
    selector: 'app-alert-widget',
    templateUrl: './alert-widget.component.html',
    styleUrls: ['./alert-widget.component.css']
})
@Widget({
    title: 'Alert',
    description: 'Gives an alert when condition is met',
    category: 'Visualize',
    indexName: 'alert',
    className: 'AlertWidgetComponent'
})

export class AlertWidgetComponent implements IWidget {

    @Input() config: AlertConfig;
    @Input() id: string;
    @Output() changeSettings = new EventEmitter<any> ();

    testvariable: boolean;
    private _interval;
    _config: AlertConfig;
    constructor(public dialog: MatDialog, private http:HttpClient) { };
    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        this._config = {
        	title: 'Alert',
        	id: this.id,
        	alertState: false,
        	alertUrl:"",
        	audioUrl:"",
        	requestType:"GET",
        	keyList: ["Test1",],
        	valueList: ["Test2",],
        	expectedList: ["Test3",],
        	comparsionTypeList: ["==",]
        };
	    if (this.config) {
	        this._config.title 		= this.config.title 		|| 'Alert Widget';
	        this._config.alertUrl 	= this.config.alertUrl 		|| "";
	        this._config.audioUrl 	= this.config.audioUrl 		|| "";
	        this._config.requestType= this.config.requestType 	|| "GET";
	        this._config.keyList	= this.config.keyList		|| ["Test1",];
	        this._config.valueList	= this.config.valueList		|| ["Test2",];
	        this._config.expectedList = this.config.expectedList|| ["Test3",];
	        this._config.comparsionTypeList = this.config.comparsionTypeList|| ["==",];

	    }
	    this.update();
	};
	playAudio(){
		if (this._config.audioUrl){
	    	let audio = new Audio();
	    	audio.src = this._config.audioUrl;
	    	audio.load();
	    	audio.play();
	    }
    }
	makeRequest() {
		if(this._config.requestType === "GET"){
			this.http.get<any>(this._config.alertUrl).subscribe(data => {

				if(this._config.expectedList[0] == data){
					this._config.alertState = true;
				}
			})
		}else if(this._config.requestType === "POST"){
			let body = {};
			var comparsionResult = [];
			const httpOptions = {
			headers: new HttpHeaders({
			'Content-Type':  'application/json'
			})
			};
			for(let i=0; i < this._config.keyList.length; i++){
				body[this._config.keyList[i]] = this._config.valueList[i]; 
			}
			this.http.post<any>(this._config.alertUrl, body, httpOptions).subscribe(data => {
				for(let i = 0; i < this._config.keyList.length; i++){
					comparsionResult.push(this.compare(i,data));
					console.log(comparsionResult);
					if(comparsionResult.every(x => x == true) && comparsionResult.length == this._config.expectedList.length){
						this._config.alertState = true;
						console.log(this._config.alertState + "AlertState");
					}
				}
				})
				
		}
	}	
	
	update() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        if (this._config.alertUrl){
	        this._interval = setInterval(() => {
	        	this.makeRequest();
	        	if(this._config.alertState){
	        		this.playAudio();
	        		clearInterval(this._interval);
	        	}
	        }, 1000);
    	}
	};
	compare(i,data) {
		
		switch (this._config.comparsionTypeList[i]) {
			    case '>':   return data[this._config.keyList[i]] > this._config.expectedList[i];
			    case '<':   return data[this._config.keyList[i]] < this._config.expectedList[i];
			    case '>=':  return data[this._config.keyList[i]] >= this._config.expectedList[i];
			    case '<=':  return data[this._config.keyList[i]] <= this._config.expectedList[i];
			    case '==':  return data[this._config.keyList[i]] == this._config.expectedList[i];
			    case '!=':  return data[this._config.keyList[i]] != this._config.expectedList[i];
  		}
	}
    async openDialog(){
    	const dialogRef = this.dialog.open(SettingAlertWidgetComponent, {
            width: '700px',
            data: {
                title: this._config.title,
                alertUrl: this._config.alertUrl,
                audioUrl: this._config.audioUrl,
                requestType: this._config.requestType,
                keyList: this._config.keyList,
                valueList: this._config.valueList,
                expectedList: this._config.expectedList,
                comparsionTypeList: this._config.comparsionTypeList,
    		}
    	});
    	const data = await dialogRef.afterClosed().toPromise();
    	if(data) {
    		this._config.title 		= data.title;
    		this._config.alertUrl 	= data.alertUrl;
    		this._config.audioUrl 	= data.audioUrl;
    		this._config.requestType= data.requestType;
    		this._config.keyList	= data.keyList;
    		this._config.valueList	= data.valueList;
    		this._config.alertState	= data.alertState;
    		this._config.expectedList = data.expectedList;
    		this._config.comparsionTypeList = data.comparsionTypeList;
    		this.changeSettings.emit({
    			config:this._config,
    			id: this.id,
    		});
    		this.update();
    	};
    }
    ngOnDestroy(){

    }

}