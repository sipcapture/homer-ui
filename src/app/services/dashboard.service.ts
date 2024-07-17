import { Functions, log, setStorage } from '@app/helpers/functions';
import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { ConstValue, UserConstValue } from '@app/models';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, lastValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface DashboardEventData {
  current: string;
  currentDashboardType?: number;
  currentWidget: any;
  currentWidgetList: Array<any>;
  resultWidget?: any;
  currentProfileList: Array<any>;
  isFromSearch: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class DashboardService {
  static dbSetting: DashboardEventData = {
    current: '',
    currentDashboardType: null,
    currentWidget: '',
    currentWidgetList: [],
    currentProfileList: [],
    resultWidget: {},
    isFromSearch: false
  };
  set dbs(val) {
    DashboardService.dbSetting = val;
  }
  get dbs() {
    return DashboardService.dbSetting;
  }
  private _backBehaviorSubject: BehaviorSubject<any>;
  public dashboardBack: Observable<any>;
  private _behavior: BehaviorSubject<any>;
  public dashboardEvent: Observable<any>;
  private url = `${environment.apiUrl}/dashboard`;
  private _eventBuffer = '';
  constructor(
    private _http: HttpClient,
    private _httpBuffer: HttpGetBuffer
  ) {
    this.dbs = Functions.JSON_parse(localStorage.getItem(UserConstValue.SQWR)) ||
      Functions.JSON_parse(localStorage.getItem(ConstValue.SQWR)) || this.dbs;

    this._behavior = new BehaviorSubject<any>(this.dbs);
    this.dashboardEvent = this._behavior.asObservable();
    this._backBehaviorSubject = new BehaviorSubject<any>({});
    this.dashboardBack = this._backBehaviorSubject.asObservable();
  }
  clearLocalStorage() {
    this.dbs = {
      current: '',
      currentWidget: {},
      currentWidgetList: [],
      resultWidget: {},
      currentProfileList: [],
      isFromSearch: false
    };
  }
  setCurrentDashBoardId(val: any) {
    if (!val) {
      return;
    }
    this.dbs.current = val;
  }

  setCurrentWidgetId(val: any) {
    this.dbs.currentWidget = val;
  }

  setWidgetListCurrentDashboard(widgetList: any) {
    this.dbs.currentWidgetList = widgetList;
    this.update();
  }
  setQueryToWidgetResult(id: string, query: any, bNoUpdate = false) {
    if (query.fields) {
      query.fields = query.fields.filter(i => i.name !== ConstValue.CONTAINER && this.filterStatus(i));
    }
    this.saveWidgetParam(id, 'timestamp', Date.now());
    this.saveWidgetParam(id, 'query', query, !bNoUpdate, true);
  }

  filterStatus(item) {
    return item.name !== 'status' || !!item.value;
  }

  setCurrentProfileList(list: any) {
    if (list && list.data && list.data.length > 0) {
      this.dbs.currentProfileList = list.data.forEach(d => ({
        alias: d.hep_alias,
        hepid: d.hepid,
        profile: d.profile
      }));
      this.update();
    }
  }

  setSliderQueryDataToWidgetResult(id: string, query: any) {
    this.saveWidgetParam(id, 'slider', query, true);
    return query;
  }

  getSliderQueryDataToWidgetResult(id: string) {
    return this.loadWidgetParam(id, 'slider');
  }

  saveWidgetParam(idWidget, paramName, paramValue, isReadyToUpdate = false, isFromSearch = false) {
    this.dbs.resultWidget = this.dbs.resultWidget || {};
    this.dbs.resultWidget[idWidget] = this.dbs.resultWidget[idWidget] || {};
    this.dbs.resultWidget[idWidget][paramName] = paramValue;
    setStorage(UserConstValue.SQWR, this.dbs);
    localStorage.removeItem(ConstValue.SQWR);
    if (isReadyToUpdate) {
      this.update(isFromSearch);
    }
  }
  loadWidgetParam(idWidget, paramName) {
    this.dbs = JSON.parse(localStorage.getItem(UserConstValue.SQWR)) ||
      JSON.parse(localStorage.getItem(ConstValue.SQWR)) || this.dbs;
    const wList = this.dbs?.resultWidget || {};
    const result = wList[idWidget] && wList[idWidget][paramName] 
    return result  || typeof result === 'boolean' ? result : null;
  }

  update(isFromSearch = false, isImportant = false) {
    if (isImportant) {
      this.dbs.currentWidgetList
        .filter(({ name }) => name.toLowerCase() === 'result')
        .forEach(({ id }) => this.saveWidgetParam(id, 'timestamp', Date.now()));
    }
    this.dbs.isFromSearch = isFromSearch;

    setStorage(UserConstValue.SQWR, this.dbs);
    localStorage.removeItem(ConstValue.SQWR);
    if (this.dbs.current && this.dbs.currentWidgetList.length) {
      const _md5hash = Functions.md5object(this.dbs);
      if (this._eventBuffer !== _md5hash) {
        this._eventBuffer = _md5hash;
        this._behavior.next(this.dbs);
      }
    }
  }
  setWidgetAsActive(id, type = null) {
    this._backBehaviorSubject.next({ id, type });
  }
  getCurrentDashBoardId() {
    return DashboardService.dbSetting?.current;
  }

  // get Dashboard store
  getDashboardStore(id: string): Observable<any> {
    return this._httpBuffer.get(`${this.url}/store/${id}`);
  }

  // post Dashboard store for ADD a new dashboard only
  postDashboardStore(id: string, data: any): Observable<any> {
    /** id - DEPRICATED */
    return this._http.post<any>(`${this.url}/store/${data.dashboardId || id || this.getCurrentDashBoardId()}`, data);
  }

  // Update json UPDATA data of dahboard
  updateDashboard(data: any): Observable<any> {
    return this._http.put<any>(`${this.url}/store/${data.dashboardId || data.id}`, data);
  }

  // delete Dashboard store
  deleteDashboardStore(id: string): Promise<any> {
    return this._http.delete<any>(`${this.url}/store/${id}`).toPromise();
  }

  // Dashboard info
  getDashboardInfo(delayBuffer = null): Observable<any> {
    return this._httpBuffer.get(`${this.url}/info`, delayBuffer);
  }
  resetDashboard() {
      return lastValueFrom(this._http.get(`${this.url}/reset`));
  }
}
