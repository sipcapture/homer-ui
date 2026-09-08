import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';

import { escapeHtml, sanitizeUntrustedHtml } from './sanitize-html';

describe('sanitizeUntrustedHtml', () => {
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
    });
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('strips event-handler markup from SIP payload HTML', () => {
    const out = sanitizeUntrustedHtml(
      sanitizer,
      '<img src=x onerror="alert(1)">INVITE sip:alice@host SIP/2.0'
    );
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain('INVITE');
  });

  it('strips script tags', () => {
    const out = sanitizeUntrustedHtml(sanitizer, '<script>alert(1)</script>Call-ID: abc');
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain('Call-ID');
  });

  it('keeps highlight spans used by stylingRowText', () => {
    const out = sanitizeUntrustedHtml(
      sanitizer,
      '<span style="font-weight:bold;color:blue">INVITE</span>'
    );
    expect(out).toContain('INVITE');
    expect(out).toContain('span');
  });

  it('returns empty string for nullish input', () => {
    expect(sanitizeUntrustedHtml(sanitizer, null)).toBe('');
    expect(sanitizeUntrustedHtml(sanitizer, '')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
  });
});
