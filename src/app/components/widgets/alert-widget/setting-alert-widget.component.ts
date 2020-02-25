import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-setting-alert-widget-component',
    templateUrl: 'setting-alert-widget.component.html',
    styleUrls: ['./setting-alert-widget.component.css']
})

export class SettingAlertWidgetComponent {
	arrayRequestType: Array<string> = ['GET', 'POST'];

	constructor(
        public dialogRef: MatDialogRef<SettingAlertWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
    onChange(){
        this.data.title;
        this.data.alertUrl;
        this.data.audioUrl;
        this.data.requestType;
    }
    testAudio(){
    	let audio = new Audio();
    	audio.src = this.data.audioUrl;
    	audio.load();
    	audio.play();
    }
}