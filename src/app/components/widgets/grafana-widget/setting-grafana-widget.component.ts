import { Component, Inject } from '@angular/core';
import { ProxyService } from '../../../services/proxy.service';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { SelectList } from '../influxdbchart-widget/setting-influxdbchart-widget.component';

@Component({
    selector: 'app-grafana-rsearch-widget-component',
    templateUrl: 'setting-grafana-widget.component.html',
    styleUrls: ['./setting-grafana-widget.component.css']
})

export class SettingIframeWidgetComponent {

    dashboardList: SelectList[] = [];
    panelList: SelectList[] = [];
    dashboardSource: any;
    panelListValue: any;

    constructor(
        public dialogRef: MatDialogRef<SettingIframeWidgetComponent>,
        private _ps: ProxyService,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit() {
        /* need get URL for grafana and orgID before we start edit */
        this.onGetGrafanaUrl();
    }

    onGetGrafanaUrl() {
        const getUrlSubscription = this._ps.getProxyGrafanaUrl().subscribe(res => {
            getUrlSubscription.unsubscribe();

            if (this.data.serverUrl === 'none' || this.data.url === 'none') {
                this.data.serverUrl = res.data;
                this.data.url = res.data;
            } else {
                this.data.serverUrl = res.data;
            }
            this.onGetGrafanaOrg();
        });
    }

    onGetGrafanaOrg() {
        const getOrgSubscription = this._ps.getProxyGrafanaOrg().subscribe(res => {
            getOrgSubscription.unsubscribe();
            this.data.params.orgId = res.id;
            this.onSyncDashboard();
        });
    }

    onSyncDashboard() {
        const getDashboardSubscription = this._ps.getProxyGrafanaFolders().subscribe(res => {
            getDashboardSubscription.unsubscribe();
            this.dashboardList = res;
            this.dashboardSource = this.dashboardList.filter(i => i.uid === this.data.dashboardSource)[0];

            if (this.dashboardSource) {
                this.onDashboardChange();
            }
        });
    }

    onDashboardChange() {
        this.data.dashboardSource = this.dashboardSource.uid;

        const getStatisticDbListSubscription = this._ps.getProxyGrafanaDashboards(this.data.dashboardSource).subscribe(res => {
            getStatisticDbListSubscription.unsubscribe();
            const localPanelList = [];
            res.dashboard.panels.forEach(function(panelId) {
                localPanelList.push({ title: panelId.title, pid: panelId.id, uid: res.dashboard.uid});
            });

            this.panelListValue = localPanelList.filter(i => i.title === this.data.panelListValue)[0] ;
            this.data.panelListValue = this.panelListValue;

            this.panelList = localPanelList;
        });
    }

    onPanelSelect() {
        this.data.panelListValue = this.panelListValue.title;
        this.data.url = this.data.serverUrl + '/d-solo/' + (this.panelListValue.uid || '...') + '/' + (this.panelListValue.title || '...');
        this.data.params.panelId = this.panelListValue.pid;
    }

    compareDashboard (a: any, b: any) {
        // data.dashboardSource
        // this.data.panelListValue
        return a.uid === b.uid && a.id === b.id;
    }

    comparePanel (a: any, b: any) {
        // data.panelListValue
        return a.title === b.title;
    }
}
