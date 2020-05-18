import { Component, Inject, ViewChild, ElementRef  } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';


@Component({
    selector: 'app-settings-ace-editor-widget-component',
    templateUrl: 'settings-ace-editor-widget.component.html',
    styleUrls: ['./settings-ace-editor-widget.component.scss']
})
export class SettingsAceEditorWidgetComponent {
    @ViewChild('editor', {static: false}) editor;

    themeList: { [key: string]: string } = {
        'Light - Dawn': 'dawn',
        'Dark - Clouds Midnight': 'clouds_midnight'
    };

    constructor(
        public dialogRef: MatDialogRef<SettingsAceEditorWidgetComponent>,
        public dialogAlarm: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    ngAfterViewInit() {
        this.editor.getEditor().setOptions({
            showLineNumbers: true,
            tabSize: 2,
            fontFamily: "Menlo,Monaco,Consolas,Courier New,monospace",
            
        });
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}