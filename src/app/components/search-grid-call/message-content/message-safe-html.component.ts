import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { sanitizeUntrustedHtml } from '@app/helpers/sanitize-html';

/**
 * Generated class for the SafeHtmlPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'safeHtml',
})
export class MessageSafeHtmlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(html) {
    return sanitizeUntrustedHtml(this.sanitizer, html);
  }

}
