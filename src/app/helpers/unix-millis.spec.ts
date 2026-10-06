import { unixMillis } from './unix-millis';

describe('unixMillis', () => {
  // https://github.com/sipcapture/homer-app/issues/644
  const usec = 1791318072561636;
  const msec = 1791318072561;

  it('converts microsecond timestamps to milliseconds', () => {
    expect(unixMillis(usec)).toBe(1791318072561.636);
  });

  it('leaves millisecond timestamps unchanged', () => {
    expect(unixMillis(msec)).toBe(msec);
  });

  it('keeps sub-millisecond gaps when both values are microseconds', () => {
    // 4733µs is the gap from issue #644 that the Flow tab showed as +4733ms.
    const later = usec + 4733;
    expect(unixMillis(later) - unixMillis(usec)).toBeCloseTo(4.733, 3);
  });

  it('returns non-finite values unchanged', () => {
    expect(unixMillis(undefined)).toBeUndefined();
    expect(unixMillis(null)).toBeNull();
    expect(unixMillis(NaN)).toBeNaN();
  });
});
