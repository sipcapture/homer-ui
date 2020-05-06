import { Component, OnInit, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import { SettingsAceEditorWidgetComponent } from './settings-ace-editor-widget.component';
import { MatDialog } from '@angular/material/dialog';
import { IWidget } from '../IWidget';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
// to use theme "eclipse"
// with angular-cli add "../node_modules/ace-builds/src-min/ace.js"
// and "../node_modules/ace-builds/src-min/theme-eclipse.js" to "scripts" var into the file angular-cli.json
export interface AceEditorConfig {
    id?: string;
    title: string;
    text: string;
    theme: string;
}

@Component({
    selector: 'app-ace-editor-widget-component',
    templateUrl: 'ace-editor-widget.component.html',
    styleUrls: ['./ace-editor-widget.component.scss']
})
@Widget({
    title: 'Embed Markdown',
    description: 'Display Custom Markdown content',
    category: 'Visualize',
    indexName: 'embed-markdown',
    className: 'AceEditorWidgetComponent',
    minHeight: 300,
    minWidth: 300
})
export class AceEditorWidgetComponent implements IWidget {
    @Input() config: AceEditorConfig;
    @Input() id: string;
    @Output() changeSettings = new EventEmitter<any> ();
    options: any = {maxLines: 1000, printMargin: false};
    isConfig = false;
    _config: AceEditorConfig

    constructor(public dialog: MatDialog) { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        this._config = {
            id: this.id,
            title: 'Markdown editor',
            text:  'Default text',
            theme: 'clouds_midnight'
        };

        if (this.config) {
            this.isConfig = true;
            this._config.title = this.config.title || 'Ace-editor';
            this._config.text = this.config.text;
            this._config.theme = this.config.theme;
        } else {
            this.isConfig = false;
        }
    }
    async openDialog() {
        const dialogRef = this.dialog.open(SettingsAceEditorWidgetComponent, {
            width: '610px',
            data: {
                title: this._config.title,
                text:  this._config.text,
                theme: this._config.theme
            }
        });
        const result = await dialogRef.afterClosed().toPromise();

        if (result) {
            this._config.title = result.title;
            this._config.text  = result.text;
            this._config.theme = result.theme;
            this.changeSettings.emit({
                config: this._config,
                id: this.id
            });
            this.isConfig = true;
        }
    }
    ngOnDestroy() { }
}
