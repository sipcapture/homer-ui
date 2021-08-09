import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { map } from 'rxjs/operators';
import { WorkerCommands } from '../../models/worker-commands.module';
import { WorkerService } from '../worker.service';

@Injectable({
    providedIn: 'root'
})
export class DtmfService {
    private url = `${environment.apiUrl}/call/report/dtmf`;

    constructor(private http: HttpClient) { }

    getDtmf(postData: any) {
        return this.http.post<any>(`${this.url}`, postData).pipe(map(
            async dtmfData => dtmfData?.data ?
                await WorkerService.doOnce(WorkerCommands.TRANSACTION_SERVICE_DTMF, dtmfData) : dtmfData
        ));
    }
}
