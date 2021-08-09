import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { UpdateAlertService } from './update-alert.service';
import { TranslateService } from '@ngx-translate/core'

@Component({
    selector: 'app-update-alert',
    templateUrl: './update-alert.component.html',
    styleUrls: ['./update-alert.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateAlertComponent implements OnInit {
    @ViewChild('refreshForm', { static: true }) refreshForm;
    message = '';
    refreshURL;
    isMessage = false;
    constructor(private updateAlertService: UpdateAlertService,
        public translateService: TranslateService) {
        translateService.addLangs(['en']);
        translateService.setDefaultLang('en')
    };

    ngOnInit() {
        // this.checkUpdate();
    }
    private async checkUpdate() {
        try {
            const { data, message } = await this.updateAlertService.check().toPromise();
            const { upgrade, version } = data || {};
            this.isMessage = upgrade;
            if (upgrade) {
                this.message = `${message} - (latest version: ${version})`;
                this.refreshURL = encodeURIComponent(window.location.href);
            }
        } catch (e) {
        }
        const delayReCheck = 1000 * 60 * 30; // 30 min

        setTimeout(this.checkUpdate.bind(this), delayReCheck);
    }
    onClose() {
        this.isMessage = false;
    }
}
