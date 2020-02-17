import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
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
}

@Component({
    selector: 'app-clock-widget',
    templateUrl: './clock-widget.component.html',
    styleUrls: ['./clock-widget.component.css']
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

    desc: string;
    name: string;
    objDate: Date;
    objTime: Date;
    _config: ClockConfig;
    location_value: number;
    private _interval;
    constructor(public dialog: MatDialog) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        this._config = {
            id: this.id,
            datePattern: ConstTime.DATA_PATTERN,
            location: {
                desc: 'Europe/Amsterdam',
                name: 'GMT+1 AMS',
                offset: '+3'
            },
            showseconds: false,
            timePattern: ConstTime.TIME_PATTERN,
            title: 'Home Clock'
        };

        if (this.config) {
            this._config.title = this.config.title || 'Clock Widget';
            this._config.datePattern = this.config.datePattern || ConstTime.DATA_PATTERN;
            this._config.timePattern = this.config.timePattern || ConstTime.TIME_PATTERN;
            this._config.showseconds = this.config.showseconds || false;

            if (this.config.location) {
                this._config.location.desc = this.config.location.desc || 'Greenwich Mean Time';
                this._config.location.name = this.config.location.name || 'GMT+0 UTC';
            }
        }

        this.desc = this._config.location.desc;
        this.name = this._config.location.name;
        this.update();
    }
    update() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        moment.tz.setDefault(this.name);

        this._interval = setInterval(() => {
            this.objDate =  moment().format("YYYY-MM-DD");
            this.objTime =  moment().format("HH:mm:ss");
        }, 1000);
    }
    async openDialog() {
        const dialogRef = this.dialog.open(SettingClockWidgetComponent, {
            width: '250px',
            data: {
                name: this.name,
                desc: this.desc,
                title: this._config.title,
                location: this._config.location
            }
        });
        const data = await dialogRef.afterClosed().toPromise();
        if (data) {
            this._config.location = data.location;

            this.name = data.name;
            this.desc = data.desc;
            this._config.title = data.title;

            this.update();

            this.changeSettings.emit({
                config: this._config,
                id: this.id
            });
        }
    }
    ngOnDestroy() { }

}
