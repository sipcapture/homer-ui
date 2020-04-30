import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget.ts';
import { SettingClockWidgetComponent } from './setting-clock-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { IWidget } from '../IWidget';
import * as _moment from 'moment';

const moment: any = _moment;

enum ConstTime {
    DATA_PATTERN = 'YYYY-MM-DD',
    TIME_PATTERN = 'HH:mm:ss'
}
export interface TimeZone {
    offset: string;
    name: string;
    desc: string;
}

export interface ClockConfig {
    id?: string;
    datePattern: string;
    showseconds: boolean;
    timePattern: string;
    title: string;
    location: TimeZone;
    showDate: boolean;
    showAnalog: string;
    fontSizeClock: number; 
    fontSizeDate: number;
    radius: number;
}

@Component({
    selector: 'app-clock-widget',
    templateUrl: './clock-widget.component.html',
    styleUrls: ['./clock-widget.component.scss']
})
@Widget({
    title: 'World Clock',
    description: 'Display date and time',
    category: 'Visualize',
    indexName: 'clock',
    className: 'ClockWidgetComponent'
})
export class ClockWidgetComponent implements IWidget {
    @Input() config: ClockConfig;
    @Input() index: string;
    @Input() id: string;

    @Output() changeSettings = new EventEmitter<any> ();
    @ViewChild('clockWidget',{static: false}) clockWidget;

    desc: string;
    name: string;
    objDate: Date;
    objTime: Date;
    _config: ClockConfig;
    location_value: number;
    private _interval;
    hourHandStyle: any;
    minuteHandStyle: any;
    secondHandStyle: any;
    constructor(public dialog: MatDialog) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        this._config = {
            id: this.id,
            datePattern: ConstTime.DATA_PATTERN,
            location: {
                desc: 'Europe/Amsterdam',
                name: 'Europe/Amsterdam',
                offset: '+2'
            },
            showseconds: false,
            timePattern: ConstTime.TIME_PATTERN,
            title: 'Home Clock',
            showDate: true,
            fontSizeClock: 20,
            fontSizeDate: 20,
            showAnalog: 'Digital',
            radius: 150,
        };

        if (this.config) {
            this._config.title = this.config.title || 'Clock Widget';
            this._config.datePattern = this.config.datePattern || ConstTime.DATA_PATTERN;
            this._config.timePattern = this.config.timePattern || ConstTime.TIME_PATTERN;
            this._config.showseconds = this.config.showseconds || false;
            this._config.showDate = this.config.showDate || true;
            this._config.fontSizeClock = this.config.fontSizeClock || 20;
            this._config.fontSizeDate = this.config.fontSizeDate || 20;
            this._config.showAnalog = this.config.showAnalog || 'Digital';
            this._config.radius = this.config.radius || 150;
            if (this.config.location) {
                this._config.location.desc = this.config.location.desc || 'Greenwich Mean Time';
                this._config.location.name = this.config.location.name || 'GMT+0 UTC';
            }
        }

        this.desc = this._config.location.desc;
        this.name = this._config.location.name;
        this.update();
    }
    resizeClock(){
        let dimension = this.clockWidget.nativeElement.getBoundingClientRect();
        if (this._config.showAnalog === 'Analog') {
            this._config.radius = Math.min(dimension['width'],dimension['height']) * 0.6;
        }else if(this._config.showAnalog === 'Both') {
            this._config.radius = Math.min(dimension['width'],dimension['height']) * 0.4;
        }
    }
    update() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        //moment.tz.setDefault(this.name);

        this._interval = setInterval(() => {
            this.objDate =  moment().tz(this.name).format("YYYY-MM-DD");
            this.objTime =  moment().tz(this.name).format("HH:mm:ss");
            this.animateAnalogClock();
            this.resizeClock();
        }, 1000);
    }

    animateAnalogClock() {

        this.hourHandStyle = { transform: `translate3d(-50%, 0, 0) rotate(${(moment().format("HH") * 30) + (moment().format("mm") * 0.5) + (moment().format("ss") * (0.5 / 60))}deg)` };
        this.minuteHandStyle = { transform: `translate3d(-50%, 0, 0) rotate(${(moment().format("mm") * 6) + (moment().format("ss") * 0.1)}deg)` };
        this.secondHandStyle = { transform: `translate3d(-50%, 0, 0) rotate(${moment().format("ss") * 6}deg)` };
    }

    async openDialog() {
        const dialogRef = this.dialog.open(SettingClockWidgetComponent, {
            width: '250px',
            data: {
                name: this.name,
                desc: this.desc,
                title: this._config.title,
                location: this._config.location,
                showDate: this._config.showDate,
                fontSizeClock: this._config.fontSizeClock,
                fontSizeDate: this._config.fontSizeDate,
                showAnalog: this._config.showAnalog,
            }
        });
        const data = await dialogRef.afterClosed().toPromise();
        if (data) {
            this._config.location = data.location;

            this.name = data.name;
            this.desc = data.desc;
            this._config.title = data.title;
            this._config.showDate = data.showDate;
            this._config.fontSizeClock = data.fontSizeClock;
            this._config.fontSizeDate = data.fontSizeDate;
            this._config.showAnalog = data.showAnalog;

            this.update();

            this.changeSettings.emit({
                config: this._config,
                id: this.id
            });
        }
    }
    ngOnDestroy() { }

}
