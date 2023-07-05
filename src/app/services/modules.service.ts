import { Injectable } from '@angular/core';
import { HttpGetBuffer } from '@app/helpers/http-get-buffer';
import { environment } from '@environments/environment';
import { lastValueFrom } from 'rxjs';


export interface Modules {
    data: Data;
    message: string;
}
interface Data {
    loki: Loki;
}
interface Loki {
    enable: boolean;
    template: string;
}


@Injectable({
    providedIn: 'root'
})
export class ModulesService {

    private url = `${environment.apiUrl}`;
    constructor(private http: HttpGetBuffer) { }
    // HOMER external applications: i.e. Loki, Prometheus, etc.
    getModules(): Promise<Modules> {
        return lastValueFrom(this.http.get<Modules>(`${this.url}/modules/status`, 120 * 1000));
    }
}
