import { AlertService } from '@app/services/alert.service';
import { PcapUploaderService } from './pcap-uploader.service';
import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Widget } from '@app/helpers/widget';
import { IWidget } from '../IWidget';
import { TranslateService } from '@ngx-translate/core'

@Component({
    selector: 'app-pcap-uploader-widget',
    templateUrl: './pcap-uploader-widget.component.html',
    styleUrls: ['./pcap-uploader-widget.component.scss']
})
@Widget({
    title: 'PCAP Uploader',
    description: 'Display date and time',
    category: 'Utils',
    indexName: 'pcapUpload',
    className: 'PcapUploaderWidgetComponent',
    settingWindow: false,
    minHeight: 300,
    minWidth: 300
})
export class PcapUploaderWidgetComponent implements IWidget, AfterViewInit {
    idDrugOver = false;
    data: any;
    filename: string;
    filesize: string;
    fileToUpload: any;
    inProgress = false;
    isDataTimeNow = false;
    @Input() config: any;
    @Input() index: string;
    @Input() id: string;

    @Output() changeSettings = new EventEmitter<any>();

    @ViewChild('fileSelect', { static: true }) fileSelect;

    constructor(
        private pcapUploaderService: PcapUploaderService,
        private cdr: ChangeDetectorRef,
        public alertService: AlertService,
       public translateService: TranslateService
    ) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }

    ngAfterViewInit() {
        const hsp = e => {
            this.idDrugOver = e.type === 'dragover';
            e.preventDefault();
            e.stopPropagation();
        };
        const handlerDrop = e => {
            hsp(e);
            Array.from(e.dataTransfer.files).forEach(this.handlerUpload.bind(this));
        };

        Object.entries({
            submit: hsp, drag: hsp, dragstart: hsp, dragend: hsp,
            dragover: hsp, dragenter: hsp, dragleave: hsp,
            drop: handlerDrop, change: e => this.handlerUpload(e.target.files[0])
        }).forEach(([key, listener]) => {
            this.fileSelect.nativeElement.addEventListener(key, listener);
        });
    }

    private handlerUpload(file) {
        this.filename = file.name;
        this.filesize = (file.size / 1024).toFixed(2);
        this.fileToUpload = file;
        this.cdr.detectChanges();
    }
    onSubmit() {
        this.inProgress = true;
        this.pcapUploaderService.postFile(this.fileToUpload, this.isDataTimeNow).subscribe(data => {
            this.inProgress = false;
            this.translateService.get('notifications.success.fileUpload').subscribe(res => {
                this.alertService.success(res);
            })
            this.filename = '';
            this.cdr.detectChanges();
        }, error => {
            this.filename = '';
            this.inProgress = false;
            // console.log(error);
        });
    }
    openDialog(): void { }

    ngOnInit() { }

    ngOnDestroy() { }
}
