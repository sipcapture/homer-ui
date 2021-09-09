import {
  HttpClient,
  HttpEvent,
  HttpHeaders,
  HttpErrorResponse,
  HttpEventType,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})

export class UploadService {
    url = environment.apiUrl;
    endopoint = `${this.url}`;
    constructor(private http: HttpClient) {}
    public upload(formData, type, isReplace, isHomer2) {
        return this.http.post(`${this.endopoint}/${type}/import${isHomer2 ? '/h2' : ''}${isReplace ? '/replace' : ''}`, formData, {
            responseType: 'json',
            headers: new HttpHeaders()
            .append('enctype', 'multipart/form-data')
            .append('Accept', 'application/json'),
        reportProgress: true,
        observe: 'events',
        });
    }
}
