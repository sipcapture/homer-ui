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
    private _behavior: BehaviorSubject<any>;
    public dashboardEvent: Observable<any>;
    private dbSetting: DashboardEventData = {
        current: '',
        currentWidgetList: [],
        resultWidget: {}
    };
    private widgetList: any;
    private url = `${environment.apiUrl}/dashboard`;

    constructor(private _http: HttpClient) {
        this.dbSetting = JSON.parse(localStorage.getItem(ConstValue.SQWR)) || this.dbSetting;
        this._behavior = new BehaviorSubject<any>(this.dbSetting);
        this.dashboardEvent = this._behavior.asObservable();
    }

    setCurrentDashBoardId(val: any) {
        this.dbSetting.current = val;
        this.update();
    }

    setWidgetListCurrentDashboard(widgetList: any) {
        this.dbSetting.currentWidgetList = widgetList;
        this.update();
    }
    setQueryToWidgetResult(id: string, query: string) {
        this.dbSetting.resultWidget[id] = {
            timestamp: Date.now(),
            query: query
        };
        this.update();
    }
    getWidgetListCurrentDashboard() {
        return this.dbSetting.currentWidgetList;
    }
    update() {
        localStorage.setItem(ConstValue.SQWR, JSON.stringify(this.dbSetting));
        this._behavior.next(this.dbSetting);
    }

    getCurrentDashBoardId() {
        return this.dbSetting.current || 'home';
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
