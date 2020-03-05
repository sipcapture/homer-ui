import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-setting-alert-widget-component',
    templateUrl: 'setting-alert-widget.component.html',
    styleUrls: ['./setting-alert-widget.component.css']
})

export class SettingAlertWidgetComponent {
	arrayRequestType: Array<string> = ['GET', 'POST'];
    comparsionTypeList: { [key: string]: string } = {
        '=': '==',
        '<': '<',
        '>': '>',
        '<=': '<=',
        '>=': '>=',
        '!=': '!=',
    };
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
    }
    addParams(){
        console.log(this.data.keyList);
        if (this.data.keyList[this.data.keyList.length - 1] != "" && this.data.valueList[this.data.valueList.length - 1] != "") {  
            this.data.keyList.push("");
            this.data.valueList.push("");
            this.data.expectedList.push("");
            this.data.comparsionTypeList.push("==");
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
}