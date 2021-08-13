import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WidgetArray, WidgetArrayInstance } from '@app/helpers/widget';
import { PreferenceAdvancedService } from '@app/services';
import { ProxyService } from '@app/services/proxy.service';

@Component({
    selector: 'app-add-dialog',
    templateUrl: './add-dialog.component.html',
    styleUrls: ['./add-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AddDialogComponent {

    isCustomSearch = false;
    widgets = {}
    customWidgets = [];
    cWidgets = [];
    objectKeys = Object.keys;
    isGrafanaProxy = false;
    catActive = 2;
    subCatActive = 2;
    subCategories = {
        'SIP Messages Search': {
            subCategory: 'Protocol'
        },
        'SIP Registration Search': {
            subCategory: 'Protocol'
        },
        'SIP Call Search': {
            subCategory: 'Protocol'
        },
        'TDR Call Search': {
            subCategory: 'Transaction'
        },
        'TDR Registration Search': {
            subCategory: 'Transaction'
        },
        'Loki Search': {
            subCategory: 'Other'
        }
    }


    constructor(
        private _pas: PreferenceAdvancedService,
        public dialogRef: MatDialogRef<AddDialogComponent>,
        private cdr: ChangeDetectorRef,
        private proxy: ProxyService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.init();
    }

    async init() {

        const advanced = await this._pas.getAll().toPromise();
     
        this.proxy.getProxyGrafanaStatus().toPromise().then(
            (result) => {
                this.isGrafanaProxy = result.data.enable
            },(error)=>{
                this.isGrafanaProxy = false;
            })

    
        const custom = advanced.data
            .filter((f) => f.category === 'custom-widget');

        const customW = custom.map((d) => (Object.values(d.data)))
            .map(m => m.filter(f => !!f.active));
        const [firstCustomW = []] = customW || [];
        this.customWidgets = [...firstCustomW];
        this.customWidgets.forEach(w => {
            w.category = 'Search';
            w.enable = true;
            w.subCategory = this.subCategories[w.title]['subCategory'];
            w.type = 'custom';
        });


        this.isCustomSearch = this.customWidgets.length > 0;

        WidgetArray.filter(i => !!i.advancedName).forEach((i) => {
            i.enable = advanced.data.filter(j => j.param === i.advancedName).length > 0 || this.isGrafanaProxy;
        });

        const allWidgets = [...WidgetArray, ...this.customWidgets];

        this.widgets = allWidgets.reduce((a, b) => {
            a[b.category] = b.subCategory ? (a[b.category] || {}) : (a[b.category] || []);
            if (b.subCategory) {
                a[b.category][b.subCategory] = a[b.category][b.subCategory] || [];
                a[b.category][b.subCategory].push(b);
            } else {
                a[b.category].push(b);
            }
            return a;
        }, {});

        this.cdr.detectChanges();
    }

    identify(index, item) {
        return item.id;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
