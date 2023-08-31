import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConstValue } from '@app/models';
import { Functions } from './functions';

@Injectable({
    providedIn: 'root',
})
export class HttpGetBuffer {
    static _buffer: any[] = [];
    static delay = 1000 * 30; // 30 sec buffering

    get username() {
        return Functions.JSON_parse(localStorage.getItem(ConstValue.CURRENT_USER))
            .user.username;
    }

    constructor(private _http: HttpClient) { }

    private getBufferItem(url: string) {
        const f = (i: any) => i.hash === this.hash(url);
        const recordItem = HttpGetBuffer._buffer?.find(f) || {};
        const { delay, lastTime } = recordItem;
        if (delay && lastTime && delay + lastTime < Date.now()) {
            const index = HttpGetBuffer._buffer.findIndex(f);
            HttpGetBuffer._buffer.splice(index, 1);
            return {};
        }
        return recordItem;
    }
    private hash(url) {
        return `${this.username}:@:${url}`;
    }
    
    public removeFromBuffer(url: string) {
        HttpGetBuffer._buffer = HttpGetBuffer._buffer.filter(request => request.url !== url)
    }
    public get<T>(url: string, delay = HttpGetBuffer.delay): Observable<T> {
        console.log(HttpGetBuffer._buffer);
        if (delay === 0) {
            return this._http.get<T>(url);
        }
        const { observable } = this.getBufferItem(url);
        if (observable) {
            return observable;
        }

        const bufferItem: any = {
            url,
            delay,
            data: null,
            hash: this.hash(url),
            lastTime: Date.now(),
            isItWasRequest: false,
            observable: new Observable<T>((observer) => {
                const reCheckData = () => {
                    const { data } = bufferItem;
                    if (data) {
                        observer.next(data as T);
                        observer.complete();
                        return;
                    }
                    setTimeout(reCheckData, 2);
                };

                if (!bufferItem.isItWasRequest) {
                    bufferItem.isItWasRequest = true;
                    this._http
                        .get<T>(url)
                        .toPromise()
                        .then(
                            (response) => {
                                bufferItem.data = response;
                                reCheckData();
                            },
                            (err) => {
                                bufferItem.isItWasRequest = false;
                            }
                        );
                }
                reCheckData();
            }),
        };

        HttpGetBuffer._buffer.push(bufferItem);
        return bufferItem.observable;
    }
}
