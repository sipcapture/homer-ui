import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
    currentWindow: string = '';
    windowList: Map<string, number> = new Map();
    closeTimeout: any;
    constructor() {}
    close(id) {
        clearTimeout(this.closeTimeout)
        this.closeTimeout = setTimeout(() => {        
            this.windowList.delete(id);
            const arrFromMap = [...this.windowList];
            if(arrFromMap.length > 0) {
                arrFromMap.sort((a,b) => 
                    a[1] - b[1]
                )
                this.currentWindow = arrFromMap.pop()[0];
            }
        }, 50);

    }
}
