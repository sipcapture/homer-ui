import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Escape text so it is safe to embed in an HTML context. */
export function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize untrusted HTML for [innerHTML].
 * Never use DomSanitizer.bypassSecurityTrustHtml() on capture data.
 */
export function sanitizeUntrustedHtml(sanitizer: DomSanitizer, html: unknown): string {
  if (html == null || html === '') {
    return '';
  }
  return sanitizer.sanitize(SecurityContext.HTML, String(html)) ?? '';
}
