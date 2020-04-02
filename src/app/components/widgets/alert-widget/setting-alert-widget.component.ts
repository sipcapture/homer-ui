import { Component, Inject } from '@angular/core';
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
	constructor(
        public dialogRef: MatDialogRef<SettingAlertWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
    onChange(){
        this.data.title;
        this.data.alertUrl;
        this.data.audioUrl;
        this.data.requestType;
        this.data.keyList;
        this.data.valueList;
        this.data.expectedList;
        this.data.comparsionType;
        this.data.alertState = false;
        this.data.alertMessage;
        this.data.comparsionLogic;
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
            if(this.data.alertSuccessColorArray[this.data.alertSuccessColorArray.length-1]!= this.data.alertSuccessColor){
            this.data.alertSuccessColorArray.push(this.data.alertSuccessColor);
            }
        }else if(type === "fail"){
            if(this.data.alertFailColorArray[this.data.alertFailColorArray.length-1]!= this.data.alertFailColor){
            this.data.alertFailColorArray.push(this.data.alertFailColor);
            }
        }else if(type === "text"){
            if(this.data.alertTextColorArray[this.data.alertTextColorArray.length-1]!= this.data.alertTextColor){
            this.data.alertTextColorArray.push(this.data.alertTextColor);
            }
        }
    }
    addParams(){
        if(this.data.requestType === "POST"){
            if (this.data.keyList[this.data.keyList.length - 1] != "") {  
                this.data.keyList.push("");
                this.data.valueList.push("");
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
        if (this.data.keyList.length > 1 && this.data.valueList.length > 1 && this.data.expectedList.length > 1) {  
            this.data.keyList.splice(i,1);
            this.data.valueList.splice(i,1);
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
        this.data.keyList     = [""];
        this.data.valueList   = [""];
        this.data.expectedList= [""];
    }
}