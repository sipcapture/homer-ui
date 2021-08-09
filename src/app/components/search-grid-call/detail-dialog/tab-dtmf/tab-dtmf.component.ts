import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { Functions } from '@app/helpers/functions';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-tab-dtmf',
    templateUrl: './tab-dtmf.component.html',
    styleUrls: ['./tab-dtmf.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabDtmfComponent implements AfterViewInit {
    dtmfArray: any = [];
    alias: any;
    overflowlimit = 21;
    @Input() set dataItem(val: any) {
        if (val && val.data && val.data.dtmf) {
            this.dtmfArray = val.data.dtmf;
            this.alias = val.data.alias;
        }
    }
    @Output() ready: EventEmitter<any> = new EventEmitter();

    constructor(public translate: TranslateService){
        translate.addLangs(['en'])
        translate.setDefaultLang('en')
    }

    toggleDTMFInfo(id: any) {

        const div = document.getElementById(id);
        const icon = document.getElementById(id + '-icon');
        if (div.style.display === 'flex') {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
        } else if (div.style.display === 'none') {
            div.style.display = 'flex';
            icon.innerHTML = 'keyboard_arrow_down';
        } else {
            div.style.display = 'none';
            icon.innerHTML = 'keyboard_arrow_right';
        }

    }
    color(str: string) {
        return Functions.getColorByString(str);
    }
    public ellipsisFormat(txt) {
        return txt?.length > this.overflowlimit ? txt?.substring(0, this.overflowlimit) + '… ' : txt;
    }
    public ellipsed(txt) {
        return txt?.length > this.overflowlimit ? txt : '';
    }
    ngAfterViewInit() {
        const getzero = (ip: string) => ip.substring(ip.length, ip.length - 2) === ':0' ? ip.substring(0, ip.length - 2) : ip;

        const ipsfiltered = (Object.keys(this.alias)).map(m => ({ name: this.alias[m], value: getzero(m) }));
        const mapAlias = (ip, port) => (ipsfiltered?.find(f => [ip, port].includes(f?.value))?.name) || ip;
        this.dtmfArray.forEach(({ message }) => {
            const { DST_IP, DST_PORT, SRC_IP, SRC_PORT } = message;
            message.DST_IP = `${mapAlias(DST_IP, DST_PORT)}:${DST_PORT}`;
            message.SRC_IP = `${mapAlias(SRC_IP, SRC_PORT)}:${SRC_PORT}`;
        });
        setTimeout(() => {
            this.ready.emit({});
        }, 35);
    }

}
