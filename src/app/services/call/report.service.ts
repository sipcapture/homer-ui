import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { map } from 'rxjs/operators';
import { WorkerService } from '../worker.service';
import { WorkerCommands } from '../../models/worker-commands.module';

@Injectable({
  providedIn: 'root'
})
export class CallReportService {
    private url = `${environment.apiUrl}/call/report`;

    constructor(private http: HttpClient) { }

    // Return call report qos
    postQOS(postData: any): Observable<any> {
        return this.http.post<any>(`${this.url}/qos`, postData).pipe(map(
            async qosData => qosData && qosData.data ? await WorkerService.doOnce(WorkerCommands.TRANSACTION_SERVICE_QOS, qosData) : qosData
        ));
    }
}
