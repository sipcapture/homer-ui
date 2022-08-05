import { Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ProxyService } from '../../../services/proxy.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectList, GroupedSelectList } from '../influxdbchart-widget/setting-influxdbchart-widget.component';
import { TranslateService } from '@ngx-translate/core'
import { environment } from '@environments/environment';
import { lastValueFrom } from 'rxjs';
@Component({
    selector: 'app-grafana-rsearch-widget-component',
    templateUrl: 'setting-grafana-widget.component.html',
    styleUrls: ['./setting-grafana-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingIframeWidgetComponent implements OnInit {

    private envUrl = `${environment.apiUrl.replace('/api/v3', '')}`;
    dashboardList: GroupedSelectList[] = [];
    panelList: SelectList[] = [];
    folderList: GroupedSelectList[] = [];
    unGroupedDashboardList: SelectList[] = [];
    dashboardSource: any;
    panelListValue: any;
    isInvalid: boolean;
    isLoggedIn = true;
    errorMessage: string;
    errorCode: number;
    isSameOrigin: boolean = false;
    constructor(
        public dialogRef: MatDialogRef<SettingIframeWidgetComponent>,
        private _ps: ProxyService,
        public translateService: TranslateService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    ngOnInit() {
        /* need get URL for grafana and orgID before we start edit */
        this.onGetGrafanaUrl();
        this.isSameOrigin = this.envUrl === `${window.location.protocol}//${window.location.host}`;
    }

    async onGetGrafanaUrl() {
        const res: any = await lastValueFrom(this._ps.getProxyGrafanaUrl());
        if (!Array.isArray(res) && res?.errorcode || res === null) {
            this.errorCode = res?.errorcode || 123;
            this.isLoggedIn = false;
            this.errorMessage = res?.data?.message || '';
        } else {
            if (this.data.serverUrl === 'none' || this.data.url === 'none') {
                this.data.serverUrl = res?.data;
                this.data.url = res?.data;
            } else {
                this.data.serverUrl = res?.data;
            }
            this.onGetGrafanaOrg();
        }
        this.cdr.detectChanges();
    }

    async onGetGrafanaOrg() {
        const res: any = await lastValueFrom(this._ps.getProxyGrafanaOrg());
        if (!Array.isArray(res) && res?.errorcode) {
            this.errorCode = res?.errorcode;
            this.isLoggedIn = false;
            this.errorMessage = res?.data?.message;
        }  else {
            this.data.params.orgId = res.id;
            this.onSyncDashboard();
        }
        this.cdr.detectChanges();
    }

    async onSyncDashboard() {
        const res: any = await lastValueFrom(this._ps.getProxyGrafanaFolders());
        if (!Array.isArray(res) && res?.errorcode) {
            this.errorCode = res?.errorcode;
            this.isLoggedIn = false;
            this.errorMessage = res?.data?.message;
        } else {
            this.isLoggedIn = true;
            const localDashboardList = [];
            res.forEach(unit => {
                if (unit.type === 'dash-db') {
                    this.unGroupedDashboardList.push(unit);
                    localDashboardList.push(unit);
                } else {
                    this.getFolderContent(unit.title, unit.id);
                }
            });
            this.dashboardList.push({
                group: 'General',
                list: localDashboardList
            });
            this.dashboardSource = this.unGroupedDashboardList.find(dashboard => dashboard.uid === this.data.dashboardSource);
        }
        if (this.dashboardSource) {
            this.onDashboardChange();
        }
        this.cdr.detectChanges();
    }
    async getFolderContent(title: string, uid: string) {
        const res = await lastValueFrom(this._ps.getProxyGrafanaSearch(uid));

        const folder = {
            group: title,
            list: res
        };
        res.forEach(unit => {
            this.unGroupedDashboardList.push(unit);
        });
        this.dashboardList.push(folder);
        this.dashboardSource = this.unGroupedDashboardList.find(dashboard => dashboard.uid === this.data.dashboardSource);
        if (this.dashboardSource) {
            this.onDashboardChange();
        }
        this.cdr.detectChanges();
    }
    async onDashboardChange() {
        this.data.dashboardSource = this.dashboardSource.uid;
        const res = await lastValueFrom(this._ps.getProxyGrafanaDashboards(this.data.dashboardSource));
        const localPanelList = [];
        res.dashboard.panels.forEach(panelId => {
            localPanelList.push({ title: panelId.title, pid: panelId.id, uid: res.dashboard.uid });
        });
        this.panelListValue = localPanelList.find(i => i.title === this.data.panelListValue);
        this.panelList = localPanelList;
        this.cdr.detectChanges();
    }

    onPanelSelect() {
        this.data.panelListValue = this.panelListValue.title;
        this.data.url = (this.panelListValue.uid || '...') + '/' + (encodeURIComponent(this.panelListValue.title) || '...');        
        this.data.params.panelId = this.panelListValue.pid;
        this.data.params.viewPanel = this.panelListValue.pid;
        this.cdr.detectChanges();
    }

    compareDashboard(a: any, b: any) {
        // data.dashboardSource
        // this.data.panelListValue
        return a?.uid === b?.uid && a?.id === b?.id;
    }

    comparePanel(a: any, b: any) {
        // data.panelListValue
        return a.title === b.title;
    }
    validate(event) {
        event = event.trim();
        if (event === '' || event === ' ') {
            this.isInvalid = true;
        } else {
            this.isInvalid = false;
        }
    }
}
