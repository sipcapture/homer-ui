import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileUploadModel } from '@app/components';
import { AuthenticationService } from '@app/services';
import { UploadService } from '@app/services/upload.service';
import { of } from 'rxjs';
import { map, tap, last, catchError } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-import',
    templateUrl: './dialog-import.component.html',
    styleUrls: ['./dialog-import.component.scss'],
    animations: [
        trigger('fadeInOut', [
            state('in', style({ opacity: 100 })),
            transition('* => void', [
                animate(300, style({ opacity: 0 }))
            ])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogImportComponent implements AfterViewInit, OnInit {
    @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;
    pageId: string;
    isReplace = false;
    isUploading = false;
    isDragOver = false;
    isUploaded = false;
    isHomer2 = false;
    uploadInfo = '';
    file: FileUploadModel;
    files = [];
    constructor(
        public uploadService: UploadService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogImportComponent>,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.pageId = data.data.pageId;
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        const hsp = e => {
            this.isDragOver = e.type === 'dragover';
            e.preventDefault();
            e.stopPropagation();
        };
        const handlerDrop = e => {
            hsp(e);
            this.onImport(e.dataTransfer.files)
        };
        const objEvents = {
            submit: hsp, drag: hsp, dragstart: hsp, dragend: hsp,
            dragover: hsp, dragenter: hsp, dragleave: hsp,
            drop: handlerDrop, change: e => this.onImport(e.target.files)
        };
        Object.keys(objEvents).forEach(eventName => {
            this.fileUpload.nativeElement.addEventListener(eventName, objEvents[eventName]);
        });
    }
    onNoClick(): void {
        this.dialogRef.close({
            isUploaded: this.isUploaded
        });
    }
    onImport(e) {
        for (const property in e) {
            if (property !== 'length' && property !== 'item') {
                this.files.push({ data: e[property], inProgress: false, progress: 0, canRetry: false, canCancel: true });
            }
        }
        this.uploadFiles();
    }
    private removeFileFromArray(file) {
        const index = this.files.indexOf(file);
        if (index > -1) {
            this.files.splice(index, 1);
        }
    }
    private uploadFiles() {
        this.fileUpload.nativeElement.value = '';
        this.files.forEach((file) => {
            this.uploadFile(file);
        });
    }
    uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file.data);
        file.inProgress = true;
        this.isUploading = true;
        this.cdr.detectChanges();
        const type = this.pageId === 'users' ? 'users' : 'ipalias';
        this.uploadService
            .upload(formData, type, this.isReplace, this.isHomer2)
            .pipe(
                map((event) => {
                    switch (event.type) {
                        case HttpEventType.UploadProgress:
                            file.progress = Math.round(
                                (event.loaded * 100) / event.total
                            );
                            this.cdr.detectChanges();
                            break;
                        case HttpEventType.Response:
                          return event;
                  }
                  return event;
                }),
                tap(message => { }),
                last(),
                catchError((error: HttpErrorResponse) => {
                    file.inProgress = false;
                    file.canRetry = true;
                    this.isUploading = false;
                    return of(`Upload failed: ${file.data.name}`);
                })
            )
            .subscribe((event: any) => {
                if (typeof (event) === 'object') {

                    if (event.body && event.body.data) {
                        this.isUploaded = true;
                        this.removeFileFromArray(file);
                        this.uploadInfo = 'Response: info: ' + JSON.stringify(event.body);

                        setTimeout(() => {
                            this.isUploading = false;
                            this.cdr.detectChanges();
                        }, 5000);
                    }
                }
            });
    }
    cancelFile(file: FileUploadModel) {
        file.sub.unsubscribe();
        this.removeFileFromArray(file);
    }

    retryFile(file: FileUploadModel) {
        this.uploadFile(file);
        file.canRetry = false;
    }
}
