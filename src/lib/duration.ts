/**
 * Convert decimal hours to seconds, guarding against NaN.
 */
export function hoursToSeconds(hours: number | string): number {
  const n = typeof hours === 'string' ? parseFloat(hours) : hours;
  return isNaN(n) ? 0 : Math.round(n * 3600);
}

/**
 * Format a duration in seconds as "1h 42m", "23m", or "9h".
 * Rounds to the nearest minute (>=30s rounds up).
 */
export function formatDuration(totalSeconds: number): string {
  let s = Math.max(0, Math.round(totalSeconds));
  let h = Math.floor(s / 3600);
  const remSec = s % 3600;
  let m = Math.round(remSec / 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Parse a Clockify ISO 8601 duration ("PT1H23M45S") into seconds.
 */
export function isoDurationToSeconds(iso: string | null | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const sec = parseInt(m[3] ?? '0', 10);
  return h * 3600 + min * 60 + sec;
}
