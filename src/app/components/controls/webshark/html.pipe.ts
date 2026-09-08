import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { sanitizeUntrustedHtml } from '@app/helpers/sanitize-html';

@Pipe({
    name: 'html'
})
export class HtmlPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    public transform(value: any) {
        return sanitizeUntrustedHtml(this.sanitizer, `<span>${value}</span>`);
    }

}
