import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { environment } from '@environments/environment';
import { PreferenceUsers, UserProfile } from '@app/models';
interface GetAllUsers {
    count: number;
    data: PreferenceUsers[];
}
interface GetUserProfile {
    count: number;
    data: UserProfile;
}
@Injectable({ providedIn: 'root' })
export class PreferenceUserService {
    constructor(private http: HttpClient) { }
    private url = `${environment.apiUrl}/users`;
    getAll() {
        return this.http.get<GetAllUsers>(`${this.url}`);
    }
    getById(id: string) {
        return this.http.get<GetAllUsers>(`${this.url}/${id}`);
    }
    getCurrentUser() {
        return this.http.get<GetUserProfile>(`${this.url}/profile`);
    }
    add(user: PreferenceUsers) {
        if (!user.version) {
            user.version = 1;
        }
        return this.http.post(`${this.url}`, user);
    }

    update(user: PreferenceUsers) {
        const guid = user.guid;
        delete user.guid;
        if (!user.version) {
            user.version = 1;
        }
        if (user.password === '') {
            delete user.password;
        }
        return this.http.put(`${this.url}/${guid}`, user);
    }
    updatePassword(user) {
        const guid = user.guid;
        return this.http.put(`${this.url}/update/password/${guid}`, user);

    }
    copy(user: PreferenceUsers) {
        if (!user.version) {
            user.version = 1;
        }
        return this.http.post(`${this.url}`, user);
    }
    delete(id: string) {
        return this.http.delete(`${this.url}/${id}`);
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

    getAllGroups() {
        return this.http.get(`${this.url}/groups`);
    }
}
