import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PreferenceIpAlias } from '@app/models';
import { Functions } from '@app/helpers/functions';

@Injectable({
  providedIn: 'root',
})
export class PreferenceIpAliasService {
  private url = `${environment.apiUrl}/alias`;

  constructor(
    private http: HttpClient,
    private httpGetBuffer: HttpGetBuffer
  ) { }
  getAll( delayBuffer = 1000 * 60 * 5 ) {
    /*return new Promise((resolve, reject) => {
      //resolve(),
      reject(null);
      /*
      this.httpGetBuffer.get<any>(this.url, delayBuffer).toPromise()
        .then(resolve, err => {
          reject(null);
        });
        */
    //});//
    return this.http.get(`${this.url}`).toPromise();
  }

  add(ipalias: PreferenceIpAlias) {
    ipalias.uuid = Functions.newGuid();
    ipalias.version = Date.now();

    return this.http.post(`${this.url}`, ipalias);

  }
  copy(ipalias: PreferenceIpAlias) {
    ipalias.uuid = Functions.newGuid();
    ipalias.version = Date.now();
    return this.http.post(`${this.url}`, ipalias);
  }
  update(ipalias: PreferenceIpAlias) {
    ipalias.version = Date.now();
    return this.http.put(`${this.url}/${ipalias.uuid}`, ipalias);
  }
  delete(uuid: string) {
    return this.http.delete(`${this.url}/${uuid}`);
  }

  export() {
    return this.http.get(`${this.url}/export`, {
      responseType: 'blob',
      headers: new HttpHeaders()
        .append('Content-Type', 'application/octect-stream')
        .append('Content-Transfer-Encoding', 'binary')
        .append('Transfer-Encoding', 'chunked')
    });
  }
  getAliasFileds() {
    return this.getAll().then((alias: any) => alias.data.map(m => ({ name: m.alias, value: m.ip })));
  }
  import(file) {
    return this.http.post(`${this.url}/import`, file, {
      responseType: 'blob',
      headers: new HttpHeaders()
        .append('enctype', 'multipart/form-data')
        .append('Accept', 'application/json'),
      reportProgress: true,
      observe: 'events',
    });
  }
  resolveAlias(withoutPort: boolean, ip: string, port?: number) {
    return this.getAll().then((result: any) => {
      const resolvedIP = result?.data.find(alias => {
        return alias.ip === ip && (withoutPort || alias.port === port || alias.port === 0)
      }
      )?.alias || ip;
      return `${resolvedIP}${withoutPort ? '' : ':' + port}`;
    }
    );
  }
}
