How to CREATE NEW WIDGET ?
==========================

Folder for all widgets is:
```
./src/app/components/widgets
```

example widget component `./my-widget/my-widget.conmponent.ts`:
```js
import { Component, Input } from '@angular/core';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { IWidget } from '../IWidget';

import { SettingMyWidgetComponent } from './setting-my-widget.component';

@Component({
    selector: 'app-my-widget',
    template: `
        <h1> My Widget </h1>
        <p>{{ config.name }}</p>
    `
})
/**
 * this decorator register a widget in project
 */
@Widget({
    title: 'My Widget',
    description: 'Widget Description',
    category: 'My Category',
    indexName: 'myWidget',
    className: 'MyWidgetComponent' // <-- the same name as class name
})
/* ... implements IWidget - very IMPORTANT !!! */
export class MyWidgetComponent implements IWidget {
    @Input() id: string;
    @Input() config: any;
    @Output() changeSettings = new EventEmitter<any> ();

    constructor() { }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget; // <--- IMPORTANT: SHOULD TO BE
        /* this.config - is JSON config for each widget instance, saves on dashboard  */
        if (!this.config) {
            this.config = {
                /* some widget data */
                title: 'default Title'
            }
        }
    }
    openDialog () { 
        /* open dialod settings for this wiget */
        const dialogRef = this.dialog.open(SettingMyWidgetComponent, {
            data: this.config || {empty: true}
        });
        const dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
            if (result) {

                this.config.title = result.title;

                /* update config for widget instance */
                this.changeSettings.emit({ config: this.config, id: this.id });
            }
            dialogRefSubscription.unsubscribe();
        })
    }
    ngOnDestroy() { }
}

```

example setting dialog for widget component `./my-widget/setting-my-widget.conmponent.ts`:

```js
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
    selector: 'app-my-clock-widget-component',
    template: `
        <mat-toolbar class="title" color="primary">
            <div>Settings</div>
            <button mat-icon-button (click)="onNoClick()">
                <mat-icon>close</mat-icon>
            </button>
        </mat-toolbar>

        <div mat-dialog-content>
            <mat-form-field>
                <mat-label>Title</mat-label>
                <input matInput [(ngModel)]="data.title">
            </mat-form-field>
        </div>
     
        <div mat-dialog-actions style="float: right; margin-bottom: 0rem;">
            <button mat-raised-button (click)="onNoClick()">Cancel</button>
            <button mat-raised-button color="primary" [mat-dialog-close]="data" cdkFocusInitial>Ok</button>
        </div>
    `,
    styleUrls: ['./my-clock-widget.component.scss']
})

export class SettingMyWidgetComponent {
    
    constructor(
        public dialogRef: MatDialogRef<SettingMyWidgetComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

```

last step, write paths in file `./src/app/components/widgets/index.ts` :
```js
...

/* my widget */
export * from './my-widget/my-widget.component';

/* settings dialog for my-widget */
export * from './my-widget/setting-my-widget.component';

...
```

finally, run project from console:
```bach
$ sudo npm run start
```