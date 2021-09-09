import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PcapUploaderService {
    private url = `${environment.apiUrl}/import/data/pcap`;
    constructor(private http: HttpClient) { }

    postFile(fileToUpload: File, isDataTimeNow): Observable<any> {
        const formData: FormData = new FormData();
        formData.append('fileKey', fileToUpload, fileToUpload.name);
        const url = isDataTimeNow ? this.url + '/now' : this.url;
        return this.http.post(url, formData);
    }
}
