import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-setting-alert-widget-component',
    templateUrl: 'setting-alert-widget.component.html',
    styleUrls: ['./setting-alert-widget.component.scss']
})

export class SettingAlertWidgetComponent {
	arrayRequestType: Array<string> = ['GET', 'POST'];
    arrayComparsionLogic: Array<string> = ['AND', 'OR'];
    comparsionTypeList: { [key: string]: string } = {
        '=': '==',
        '<': '<',
        '>': '>',
        '<=': '<=',
        '>=': '>=',
        '!=': '!=',
    };
    public show = [false,false,false];
    public showPicker = [false, false,false];
    colorsSuccess: any;
    colorsFail: any;
    colorsText: any;
	constructor(
        public dialogRef: MatDialogRef<SettingAlertWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
    ngOnInit(){
        this.colorsSuccess = Promise.resolve(this.data.alertSuccessColorArray);
        this.colorsFail = Promise.resolve(this.data.alertFailColorArray);
        this.colorsText = Promise.resolve(this.data.alertTextColorArray);

    }
    onChange(){
        this.data.title;
        this.data.alertUrl;
        this.data.audioUrl;
        this.data.requestType;
        this.data.keyList;
        this.data.postData;
        this.data.expectedList;
        this.data.comparsionType;
        this.data.alertState = false;
        this.data.alertMessage;
        this.data.comparsionLogic;
        this.data.alertDuration;
    }
    changeColorManual(color: any, type: string): void {
        if(type === "success"){
            this.data.alertSuccessColor = color;
        }else if(type === "fail"){
            this.data.alertFailColor = color;
        }else if(type === "text"){
            this.data.alertTextColor = color;
        }
    }
    addToPalette(type){
        if(type === "success"){
            if(!this.data.alertSuccessColorArray.includes(this.data.alertSuccessColor) && this.data.alertSuccessColorArray.length<8){
            this.data.alertSuccessColorArray.push(this.data.alertSuccessColor);
            this.colorsSuccess = Promise.resolve(this.data.alertSuccessColorArray);
            }
        }else if(type === "fail"){
            if(!this.data.alertFailColorArray.includes(this.data.alertFailColor) && this.data.alertFailColorArray.length<8){
            this.data.alertFailColorArray.push(this.data.alertFailColor);
            this.colorsFail = Promise.resolve(this.data.alertFailColorArray);
            }
        }else if(type === "text"){
            if(!this.data.alertTextColorArray.includes(this.data.alertTextColor) && this.data.alertTextColorArray.length<8){
            this.data.alertTextColorArray.push(this.data.alertTextColor);
            this.colorsText = Promise.resolve(this.data.alertTextColorArray);

            }
        }
    }
    addParams(){
        if(this.data.requestType === "POST"){
            if (this.data.keyList[this.data.keyList.length - 1] != "") {  
                this.data.keyList.push("");
                this.data.expectedList.push("");
                this.data.comparsionTypeList.push("==");
            }
        }else{
            if (this.data.expectedList[this.data.expectedList.length - 1] != ""){
                this.data.keyList.push("");
                this.data.expectedList.push("");
                this.data.comparsionTypeList.push("==");
            }
        }
    }
    deleteParams(i){
        if (this.data.keyList.length > 1 && this.data.expectedList.length > 1) {  
            this.data.keyList.splice(i,1);
            this.data.expectedList.splice(i,1);
            this.data.comparsionTypeList.splice(i,1);            
        }

    }
    testAudio(){
        if (this.data.audioUrl){
        	let audio = new Audio();
        	audio.src = this.data.audioUrl;
        	audio.load();
        	audio.play();
        }
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    trackByFn(index, item) {
        return index;  
    }
    toggleColors(i): void {
        this.show[i] = !this.show[i];
    }
    togglePicker(i){
        this.showPicker[i] = !this.showPicker[i];
    }
    changeRequestType(){
        this.data.alertUrl = this.data.alertUrl.replace(/(\?|\&)([^=]+)\=([^&]+)/, "");
        this.data.keyList     = [""];
        this.data.postData   = "{}";
        this.data.expectedList= [""];
        this.data.comparsionTypeList = ["=="];

    }
}