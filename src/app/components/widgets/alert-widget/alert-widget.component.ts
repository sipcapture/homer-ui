import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, Injectable } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget.ts';
import { SettingAlertWidgetComponent } from './setting-alert-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { IWidget } from '../IWidget';

export interface AlertConfig {
    id?: string;
    title: string;
    alertState: boolean;
    alertUrl: string;
    audioUrl: string;
    requestType: string;
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
        };
	    if (this.config) {
	        this._config.title 		= this.config.title || 'Clock Widget';
	        this._config.alertUrl 	= this.config.alertUrl || "";
	        this._config.audioUrl 	= this.config.audioUrl || "";
	        this._config.requestType 	= this.config.requestType || "GET";

	    }
	    this.update();
	};
	playAudio(){
    	let audio = new Audio();
    	audio.src = this._config.audioUrl;
    	audio.load();
    	audio.play();
    }
	makeRequest() {
		this.http.get<any>(this._config.alertUrl).subscribe(data => {
            this.testvariable = data;
            if(this.testvariable == true){
            	this._config.alertState = true;
            }else{
            	this._config.alertState = false;
            }
        })
	}	
	update() {
        if (this._interval) {
            clearInterval(this._interval);
        }

        this._interval = setInterval(() => {
        	this.makeRequest();
        	if(this._config.alertState==true){
        		this.playAudio();
        		clearInterval(this._interval);
        	}
        }, 1000);
	};
    async openDialog(){
    	const dialogRef = this.dialog.open(SettingAlertWidgetComponent, {
            width: '500px',
            data: {
                title: this._config.title,
                alertUrl: this._config.alertUrl,
                audioUrl: this._config.audioUrl,
                requestType: this._config.requestType,
    		}
    	});
    	const data = await dialogRef.afterClosed().toPromise();
    	if(data) {
    		this._config.title 		= data.title;
    		this._config.alertUrl 	= data.alertUrl;
    		this._config.audioUrl 	= data.audioUrl;
    		this._config.requestType= data.requestType;
    		this.changeSettings.emit({
    			config:this._config,
    			id: this.id,
    		})
    		this.update();
    	};
    }
    ngOnDestroy(){

    }

}