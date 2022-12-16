import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceAgentsub } from '@app/models';

@Injectable({
    providedIn: 'root'
})
export class AgentsubService {

    private url = `${environment.apiUrl}/agent`;

    constructor(private http: HttpClient, private httpGetBuffer: HttpGetBuffer) { }

    // Agentsub protokols
    getProtokols(): Observable<PreferenceAgentsub> {
        return this.httpGetBuffer.get<PreferenceAgentsub>(`${this.url}/subscribe`);
    }

    // Agentsub fields
    getFields(): Observable<PreferenceAgentsub> {
        return this.http.get<PreferenceAgentsub>(`${this.url}/fields`);
    }

    // perform lookup for data type against HEPSUB subscriber UUID, if type is download file data will be returned
    getHepsubElements({uuid, type, data}): Observable<any> {
        let options = type === 'download' ? {responseType: 'blob' as 'json'} : undefined;
        return this.http.post<any>(`${this.url}/search/${uuid}/${type}`, data, options);
    }

    // type = 'cdr' | 'wav' | 'json'
    getType(type: string): Observable<any> {
        return this.http.get<any>(`${this.url}/type/${type}`);
    }

    getAgentCdr(type): Observable<any> {
        /**
         * TODO:
         * transaction dialog / logs / HEPSUB:"test-endpoint"/ cdr
         * as on HOMER [domain:port-1]/dashboard/home
         * [domain:port-1]/api/v3/agent/type/cdr
         */
        return this.http.get(`${this.url}/type/${type}`);
    }

    getData(agent: any, type?: string): Observable<any> {
        // console.log({agent, type});
        const { protocol, host, port, path } = agent;
        const returnDefault = () => new Observable<any>(observer => {
            observer.next(null);
            observer.complete();
        });
        if (protocol !== 'http' && protocol !== 'https') {
            return returnDefault();
        }
        const headers = new HttpHeaders().set('Content-Type', 'application/json');

        try {
            return this.http.post(`${protocol}://${host}:${port}${path}/${type}`, { headers });
        } catch (err) {
            return returnDefault();
        }
    }
}
