import { environment } from "@environments/environment";
import { isSameHost, Functions } from "./functions";

export function getUriJson(): any {
    if (location.search) {
        try {
            return JSON.parse(
                decodeURIComponent(location.search.slice(1, -1))
            );
        } catch (err) {
            const out = location.search
                .slice(1)
                .split('&')
                .reduce((a, i) => {
                    const [key, value] = i.split('=');
                    if (key && value) {
                        a[key] = value;
                    }
                    return a;
                }, {});
            if (JSON.stringify(out) === '{}') {
                return null;
            } else {
                return out;
            }
        }
    } else {
        return null;
    }
}
export function getUriParams(): any {
    if (!!location.hash) {
        return location.hash.replace('#', '');
    }
    const lSearch = location.search || '';
    return lSearch
        ? lSearch
            .split('&')
            .map((i) => i.replace('?', '').split('='))
            .reduce((a, b) => ((a[b[0]] = b[1]), a), {})
        : { callid: null, from: null, to: null, uuid: null };
}
export function shareLinkUUID(): string {
    return (location?.hash || '')?.replace('#', '') || '';
}
export function emitWindowResize(): void {
    setTimeout(() => {
        try {
            window.dispatchEvent(new Event('resize'));
        } catch (e) { }
    });
}
export function getJsonFileDataByLink(name: string): Promise<any> {
    return new Promise((resolve) => {
        resolve(window[`file__json_data_${name}`] || {});
    });
}
export function saveToFile(data, filename, type = 'application/octet-stream') {
    const file = new Blob([data], { type: type });
    const nav: any = window.navigator as any;
    if (nav.msSaveOrOpenBlob) {
        // IE10+
        nav.msSaveOrOpenBlob(file, filename);
    } else {
        // Others
        const a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.target = '(file)';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
export function console2file(data, filename) {
    if (!data) {
        console.error('Console.save: No data');
        return;
    }

    if (!filename) {
        filename = 'console.json';
    }

    if (typeof data === 'object') {
        data = JSON.stringify(data, undefined, 4);
    }

    saveToFile(data, filename, 'txt/json');
}
export function setStorage(key: string, value: any): void {
    // saving JSON from object data
    // log('setStorage >>>', key, value);
    return localStorage.setItem(key, JSON.stringify(value));
}
export function getStorage(key: string): any {
    // log('getStorage <<<', key, Functions.JSON_parse(localStorage.getItem(key)));
    return Functions.JSON_parse(localStorage.getItem(key));
}

export function getSelectedText() {
    let selectedText: any = '';

    // window.getSelection
    if (window.getSelection) {
        selectedText = window.getSelection();
    }
    // document.getSelection
    else if (document.getSelection) {
        selectedText = document.getSelection();
    }
    // document.selection
    else if (document['selection']) {
        selectedText = document['selection']?.createRange()?.text;
    } else {
        return '';
    }
    // To write the selected text into the textarea
    return selectedText + '';
}

export function isCurrentHost(host: string): boolean {
    return isSameHost(window?.location.href, host) || isSameHost(environment.apiUrl, host)
}
