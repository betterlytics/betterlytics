import moment from 'moment-timezone';

export const FALLBACK_TIMEZONE = 'Etc/UTC';

export type TimezoneSource = 'setting' | 'browser' | 'fallback';

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz === '' || tz === 'Etc/Unknown') return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserTimezone(): string | null {
  try {
    // Some browsers with broken ICU report undefined or 'Etc/Unknown' here (#238)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(tz) ? tz : null;
  } catch {
    return null;
  }
}

export function resolveTimezone(
  setting: string | null | undefined,
  browser: string | null,
): { timeZone: string; source: TimezoneSource } {
  if (isValidTimezone(setting)) return { timeZone: setting, source: 'setting' };
  if (browser) return { timeZone: browser, source: 'browser' };
  return { timeZone: FALLBACK_TIMEZONE, source: 'fallback' };
}

export function getSupportedTimezones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    if (zones.length > 0) return zones;
  } catch {}
  // ICU-independent list for the broken-Intl case
  return moment.tz.names();
}
