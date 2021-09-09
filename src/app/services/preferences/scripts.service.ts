import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";
import { PreferenceScripts } from "@app/models";
import { Functions } from "@app/helpers/functions";

@Injectable({
  providedIn: "root",
})
export class PreferenceScriptsService {
  constructor(private http: HttpClient) {}

  private url = `${environment.apiUrl}/script`;

  getAll() {
    return this.http.get<PreferenceScripts[]>(`${this.url}`);
  }
  add(script: PreferenceScripts) {
    script.uuid = Functions.newGuid();
    script.version = Date.now();

    return this.http.post(`${this.url}`, script);
  }
  update(script: PreferenceScripts) {
    script.version = Date.now();
    let uuid = script.uuid;
    return this.http.put(`${this.url}/${uuid}`, script);
  }
  delete(uuid: string) {
    return this.http.delete(`${this.url}/${uuid}`);
  }

  export(file) {
    return this.http.post(`${this.url}/export`, file);
  }

  import(file) {
    return this.http.post(`${this.url}/import`, file);
  }
}
