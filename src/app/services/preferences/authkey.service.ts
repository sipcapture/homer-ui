import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAuthKey } from '@app/models';
import { Observable } from 'rxjs';
import { Functions } from '@app/helpers/functions';

@Injectable({
    providedIn: 'root'
})
export class PreferenceAuthKeyService {
    static actualToken: PreferenceAuthKey[];
    static httpObserver: Observable<PreferenceAuthKey[]>;
    private paks = PreferenceAuthKeyService;
    private url = `${environment.apiUrl}/token/auth`;
    set actualToken(val: PreferenceAuthKey[]) {
        this.paks.actualToken = val;
    }
    get actualToken(): PreferenceAuthKey[] {
        return Functions.cloneObject(this.paks.actualToken);
    }

    constructor(private http: HttpClient) {
        this.paks.httpObserver = this.paks.httpObserver || new Observable<PreferenceAuthKey[]>(observer => {
            if (!this.actualToken) {
                this.actualToken = [];
                this.http.get(this.url).toPromise().then(
                    ({ data }: any) => {
                        if (data) {
                            this.actualToken = data;
                            observer.next(data);
                            observer.complete();
                        } else {
                            observer.error(new Error('Token is empty'));
                            observer.complete();
                        }
                    }, err => {
                        console.error(new Error(err));

                        observer.error(err);
                        observer.complete();
                    });
            } else if (this.actualToken.length === 0) {
                const recheckActualToken = () => {
                    if (this.actualToken.length === 0) {
                        setTimeout(recheckActualToken, 10);
                    } else {
                        observer.next(this.actualToken);
                        observer.complete();
                    }
                };
                recheckActualToken();
            } else {
                observer.next(this.actualToken);
                observer.complete();
            }
        });
    }
    getAll(): Observable<PreferenceAuthKey[]> {
        return this.http.get<PreferenceAuthKey[]>(`${this.url}`);
    }

    add(pa: PreferenceAuthKey): Observable<any> {
        this.actualToken = null;
        return this.http.post(`${this.url}`, pa);
    }

    update(pa: PreferenceAuthKey): Observable<any> {

        const guid = pa.guid;
        delete pa.guid;
        this.actualToken = null;
        return this.http.put(`${this.url}/${guid}`, pa);
    }

    delete(guid: string): Observable<any> {
        this.actualToken = null;
        return this.http.delete(`${this.url}/${guid}`);
    }

}
