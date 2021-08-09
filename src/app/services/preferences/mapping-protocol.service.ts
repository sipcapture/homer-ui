import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ConstValue, PreferenceMapping, UserConstValue } from '@app/models';
import { Functions, getStorage } from '@app/helpers/functions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SessionStorageService } from '../session-storage.service';

@Injectable({
    providedIn: 'root'
})
export class PreferenceMappingProtocolService {
    static actualMapping: PreferenceMapping[];
    static margedMapping: PreferenceMapping[];
    static httpObserver: Observable<PreferenceMapping[]>;
    static protocol_id;
    private pmps = PreferenceMappingProtocolService;
    private url = `${environment.apiUrl}/mapping/protocol`;

    set actualMapping(val: PreferenceMapping[]) {
        this.pmps.actualMapping = val;
    }

    get actualMapping(): PreferenceMapping[] {
        return Functions.cloneObject(this.pmps.actualMapping); // internal object can't be modify
    }

    constructor(private http: HttpClient, private _sss: SessionStorageService) {
        this.pmps.httpObserver = this.pmps.httpObserver || new Observable<PreferenceMapping[]>(observer => {
            if (!this.actualMapping) {
                this.actualMapping = [];
                this.http.get<PreferenceMapping[]>(this.url).toPromise().then(
                    ({ data }: any) => {
                        if (data) {
                            this.actualMapping = data;
                            observer.next(data);
                            observer.complete();
                        } else {
                            observer.error(new Error('mapping is empty'));
                            observer.complete();
                        }
                    }, err => {
                        console.error(new Error(err));
                        observer.error(err);
                        observer.complete();
                    });
            } else if (this.actualMapping.length === 0) {
                const recheckActualMapping = () => {
                    if (this.actualMapping.length === 0) {
                        setTimeout(recheckActualMapping, 10);
                    } else {
                        observer.next(this.actualMapping);
                        observer.complete();
                    }
                };
                recheckActualMapping();
            } else {
                observer.next(this.actualMapping);
                observer.complete();
            }
        });
    }

    getAll(): Observable<PreferenceMapping[]> {
        return this.pmps.httpObserver;
    }
    getMerged(): Observable<PreferenceMapping[]> {
        return this.pmps.httpObserver.pipe(map(data => this.margedCustomAndBaseMapping()));
    }
    
    getCurrentMapping(): Array<any> {
        if (!this.pmps.protocol_id) {
            const { protocol_id } =
                getStorage(UserConstValue.SEARCH_QUERY) ||
                getStorage(ConstValue.SEARCH_QUERY) || {};
            this.pmps.protocol_id = protocol_id || [];
            setTimeout(() => {
                this.pmps.protocol_id = null;
            }, 1000);
        }

        const { fields_mapping }: any = this.margedCustomAndBaseMapping()?.find(
            ({ hepid, profile }) => `${hepid}_${profile}` === this.pmps.protocol_id
        ) || { fields_mapping: [] };
        const mappingStatusItem: any = fields_mapping?.find(f => f.id === 'status') || { form_default: [] };
        return mappingStatusItem?.form_default;
    }
    private margedCustomAndBaseMapping() {
        if (!this.actualMapping) {
            return null;
        }
        const mergedMapping = Functions.cloneObject(this.actualMapping);
        mergedMapping.forEach(element => {
            const { user_mapping, fields_mapping } = element;
            if (user_mapping instanceof Array) {
                const filteredData = fields_mapping.filter(i => !user_mapping.find(j => j.id === i.id))
                element.fields_mapping = [...filteredData, ...user_mapping];
            }
        });
        return mergedMapping;
    }

    /**
     * Key: 'TableMappingSchema.Version' Error:Field validation for 'Version' failed on the 'required' tag"
     */
    add(pmp: PreferenceMapping): Observable<any> {
        pmp.guid = Functions.newGuid();
        pmp.version = 1;
        this.actualMapping = null; // for update actual data
        return this.http.post(`${this.url}`, pmp);
    }

    update(pmp: PreferenceMapping): Observable<any> {
        this.actualMapping = null; // for update actual data
        return this.http.put(`${this.url}/${pmp.guid}`, pmp);
    }

    delete(guid): Observable<any> {
        this.actualMapping = null; // for update actual data
        return this.http.delete(`${this.url}/${guid}`);
    }

    reset(uuid): Observable<any> {
        this.actualMapping = null; // for update actual data
        return this.http.get(`${this.url}/reset/${uuid}`);
    }

    getListByUrl(urlList: string): Observable<any> {
        // this.actualMapping = null; // for update actual data
        return this.http.get<any>(`${environment.apiUrl}${urlList}`);
    }
    resetMapping() {
        this.actualMapping = null; // for update actual datas
        return this.http.get(`${this.url}/reset`);
    }

}
