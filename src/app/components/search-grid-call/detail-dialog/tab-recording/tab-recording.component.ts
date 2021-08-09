import { Functions } from '@app/helpers/functions';
import { ConstValue } from '@app/models/const-value.model';
import { RecordingService } from '@app/services/call/recording.service';
import { Component, OnInit, Output, EventEmitter, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';

import * as WaveSurfer from 'wavesurfer.js';

// https://wavesurfer-js.org/example/timeline-notches/index.html

@Component({
    selector: 'app-tab-recording',
    templateUrl: './tab-recording.component.html',
    styleUrls: ['./tab-recording.component.scss']
})
export class TabRecordingComponent implements OnInit, AfterViewInit {
    @Output() ready: EventEmitter<any> = new EventEmitter();

    optionsAudioContainer = {
        waveColor: '#D2EDD4',
        progressColor: '#46B54D',
        responsive: true,
        minPxPerSec: 1
    }

    recordlist: any[] = [];

    @Input() set dataItem(_dataItem) {
        if (_dataItem.data?.recording) {

            this.recordlist = Object.entries(this.getArrRecords(_dataItem.data.recording))
                .filter(([, rec]: any[]) => rec.type === 'rtp')
                .map(([key, rec]: any[]) => {
                    return {
                        index: key + 1,
                        id: `rec-${key}`,
                        type: rec.type,
                        mp3: this.recordingService.getMp3Link(rec.uuid),
                        src: rec,
                        player: null,
                        isPlay: false
                    };
                });

            this.update();
            this.cdr.detectChanges();
        }
    }
    constructor(
        private recordingService: RecordingService,
        private cdr: ChangeDetectorRef
    ) {

    }
    ngOnInit() {
        // this.recordingService
    }
    downloadMP3(rec) {
        this.recordingService.getMp3Data(rec.src.uuid).subscribe(data => {
            Functions.saveToFile(data, `${rec.src.filename}.mp3`);
        })
    }
    async downloadPCAP(rec) {
        this.recordingService.getDownloadRtp(rec.src.type, rec.src.uuid).subscribe(data => {
            Functions.saveToFile(data, rec.src.filename);
        });

    }
    private getJWT() {
        const current_user: any = Functions.JSON_parse(localStorage.getItem(ConstValue.CURRENT_USER));
        return {
            xhr: {
                requestHeaders: [{
                    key: 'Authorization',
                    value: 'Bearer ' + (current_user?.token || '')
                }]
            }
        };
    }
    private getArrRecords(data: any) {
        return Object.entries(data).reduce((a, b) => {
            const [type, recArr]: any[] = b;
            recArr.forEach(i => i.type = type);
            a.push(...recArr);
            return a;
        }, []);
    }
    play(id) {
        const rec = this.recordlist.find(i => i.id === id);
        if (rec.isPlay) {
            rec.player.pause();
        } else {
            rec.player.play();
        }
        rec.isPlay = !rec.isPlay;
    }
    update() {
        setTimeout(() => {
            this.recordlist.forEach(rec => {
                if (!rec.player) {
                    try {
                        const options = {
                            ...this.optionsAudioContainer,
                            ...this.getJWT(),
                            ...{ container: '#' + rec.id }
                        };

                        rec.player = WaveSurfer.create(options);
                        rec.player.load(rec.mp3);
                    } catch (err) {
                    }
                }
            });
            this.cdr.detectChanges();
        });
    }
    ngAfterViewInit() {
        this.update();
        this.ready.emit({});
    }

}
