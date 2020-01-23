import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';
import { PreferenceUsers } from '@app/models';

@Injectable({ providedIn: 'root' })
export class PreferenceUserService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<PreferenceUsers[]>(`${environment.apiUrl}/users`);
    }

    getById(id: number) {
        return this.http.get(`${environment.apiUrl}/users/${id}`);
    }

    add(user: PreferenceUsers) {
        return this.http.post(`${environment.apiUrl}/users`, user);
    }

    update(user: PreferenceUsers) {
        const guid = user.guid;
        delete user.guid;
        if (user.password === '') {
            delete user.password;
        }
        return this.http.put(`${environment.apiUrl}/users/${guid}`, user);
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/users/${id}`);
    }
}
