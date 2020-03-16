import { DashboardModel, ConstValue } from '@app/models';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';

export interface DashboardEventData {
    current: string;
    currentWidgetList: Array<any>;
    resultWidget?: any;
}

@Injectable({
    providedIn: 'root'
})

export class DashboardService {
    static dbSetting: DashboardEventData = {
        current: '',
        currentWidgetList: [],
        resultWidget: {}
    };

    private _behavior: BehaviorSubject<any>;
    public dashboardEvent: Observable<any>;
    private widgetList: any;
    private url = `${environment.apiUrl}/dashboard`;

    constructor(private _http: HttpClient) {
        DashboardService.dbSetting = JSON.parse(localStorage.getItem(ConstValue.SQWR)) || DashboardService.dbSetting;
        this._behavior = new BehaviorSubject<any>(DashboardService.dbSetting);
        this.dashboardEvent = this._behavior.asObservable();
    }
    clearLocalStorage() {
        DashboardService.dbSetting = {
            current: '',
            currentWidgetList: [],
            resultWidget: {}
        };
    }
    setCurrentDashBoardId(val: any) {
        DashboardService.dbSetting.current = val;
        this.update();
    }

    setWidgetListCurrentDashboard(widgetList: any) {
        DashboardService.dbSetting.currentWidgetList = widgetList;
        this.update();
    }
    setQueryToWidgetResult(id: string, query: string) {
        DashboardService.dbSetting.resultWidget[id] = {
            timestamp: Date.now(),
            query: query
        };
        this.update();
    }
    setSliderQueryDataToWidgetResult(id: string, query: any) {
        DashboardService.dbSetting.resultWidget = DashboardService.dbSetting.resultWidget || {};
        DashboardService.dbSetting.resultWidget[id] = DashboardService.dbSetting.resultWidget[id] || {};
        DashboardService.dbSetting.resultWidget[id].slider = query;
        this.update();
        return query;
    }
    getSliderQueryDataToWidgetResult(id: string) {
        DashboardService.dbSetting = JSON.parse(localStorage.getItem(ConstValue.SQWR)) || DashboardService.dbSetting;
        if (
            DashboardService.dbSetting.resultWidget &&
            DashboardService.dbSetting.resultWidget[id] &&
            DashboardService.dbSetting.resultWidget[id].slider
        ) {
            return DashboardService.dbSetting.resultWidget[id].slider;
        }
        return null;
    }
    getDbSetting() {
        return DashboardService.dbSetting;
    }
    getWidgetListCurrentDashboard() {
        return DashboardService.dbSetting;
    }
    update() {
        localStorage.setItem(ConstValue.SQWR, JSON.stringify(DashboardService.dbSetting));
        this._behavior.next(DashboardService.dbSetting);
    }

    getCurrentDashBoardId() {
        return DashboardService.dbSetting.current || 'home';
    }

    // Update json
    updateDashboard(id: string, params): Observable<DashboardModel> {
        const httpOptions = { headers: new HttpHeaders({ 'Content-Type':  'application/json' })};
        return this._http.put<DashboardModel>(`${this.url}/store/${id}`, params, httpOptions);
    }

    // Dashboard node
    getDashboardNode(id: string): Observable<DashboardModel> {
        return this._http.get<DashboardModel>(`${this.url}/node/${id}`);
    }

    // get Dashboard store
    getDashboardStore(id: string): Observable<any> {
        return this._http.get<any>(`${this.url}/store/${id}`);
    }

    // post Dashboard store
    postDashboardStore(id: string, data: any): Observable<any> {
        return this._http.post<any>(`${this.url}/store/${id}`, data);
    }

    // delete Dashboard store
    deleteDashboardStore(id: string): Observable<any> {
        return this._http.delete<any>(`${this.url}/store/${id}`);
    }

    // set Dashboard store
    setDashboardStore(id: string, config: object): Observable<DashboardModel> {
        return this._http.post<DashboardModel>(`${this.url}/store/`, config);
    }

    // Dashboard menu
    getDashboardMenu(): Observable<DashboardModel> {
        return this._http.get<DashboardModel>(`${this.url}/menu/`);
    }

    // Dashboard info
    getDashboardInfo(): Observable<any> {
        return this._http.get<any>(`${this.url}/info`);
    }
}
