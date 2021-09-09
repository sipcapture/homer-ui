import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';

export type IdType = 'sip' | 'rtp' | 'tcp' | 'udp' | 'ip' | 'eth' | 'sdp' | 'http' | 'isup' | 'ssh';

class Buffer {
    static data: any = {};
}
export class VItem {
    description: string;
    type: string;
    source_value: string;

    constructor(description: string = '', type: string = '') {
        this.description = description;
        this.type = type;
    }

    public toString(): string {
        return this.description;
    }
}

@Injectable({
    providedIn: 'root'
})
export class WebsharkDictionaryApiService {
    private url = `${environment.apiUrl}/protocol/search/`;

    constructor(private http: HttpClient) { }

    get(id: IdType): Promise<any> {
        return new Promise<any>(async (resolve) => {
            if (!Buffer.data[id]) {
                Buffer.data[id] = await this.getVocabularyById(id);
            }
            resolve(Buffer.data[id]);
        });
    }
    getVocabularyById(id: IdType): Promise<any> {
        return this.http.get<any>(this.url + id).pipe(map(data => {
            const out = data;
            const [dataItem] = out?.data || [];
            const vData: any[] = dataItem?.data;
            if (vData) {
                return vData.reduce((a, { fieldname, description, type }) => {
                    if (fieldname && description) {
                        a[fieldname] = new VItem(description, type);
                    }
                    return a;
                }, {});

            }
            return [];
        })).toPromise();
    }
}
