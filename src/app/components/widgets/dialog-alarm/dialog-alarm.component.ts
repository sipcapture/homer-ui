import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Functions } from '@app/helpers/functions';
import { PreferenceAdvancedService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-alarm',
    templateUrl: './dialog-alarm.component.html',
    styleUrls: ['./dialog-alarm.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAlarmComponent {
    presetList: Array<any> = [];
    selectedPreset: any;
    isSearch = false;
    constructor(
        private _pas: PreferenceAdvancedService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogAlarmComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        this.isSearch = data ? true : false;
    }
    async ngOnInit() {

        const advanced = await this._pas.getAll().toPromise();
        if (this.isSearch) {
            const [custom] = advanced.data
                .filter((f) => f.category === 'custom-widget')
                .map((d) => (Object.values(d.data)))
                .map(m => m.filter(f => !!f.active));
            this.presetList = Functions.cloneObject(custom);
            const profile = this.data.config.profile;
            const protocol_id = this.data.config.protocol_id;
            this.selectedPreset = this.presetList.find(preset => preset.data.config.profile === profile &&
                preset.data.config.protocol_id.value === protocol_id.value &&
                preset.data.config.protocol_id.name === protocol_id.name
            );
            this.changePreset()
        }

    }
    changePreset() {
        this.data.config = this.selectedPreset;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
