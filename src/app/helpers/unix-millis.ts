// Unix milliseconds stay below 1e14 until year 5138.
// Microsecond timestamps (homer-app 1.5.16 through 1.5.21, see
// https://github.com/sipcapture/homer-app/issues/644) are about 1e15.
const MICROSECOND_TIMESTAMP = 1e14;

/**
 * Normalize a Homer timestamp to Unix milliseconds.
 * Values already in milliseconds are returned unchanged. Values in
 * microseconds are divided by 1000, including the fractional millisecond,
 * so Flow deltas keep sub-millisecond precision.
 */
export function unixMillis(
  ts: number | undefined | null
): number | undefined | null {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) {
    return ts;
  }
  return Math.abs(ts) >= MICROSECOND_TIMESTAMP ? ts / 1000 : ts;
}
