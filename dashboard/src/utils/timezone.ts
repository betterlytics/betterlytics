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
    // Some browsers with broken ICU report undefined or 'Etc/Unknown' here
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

export function createDateTimeFormat(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: timeZone ?? options.timeZone });
  } catch {
    // Broken ICU can reject the zone; browser-zone output beats a crash
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: undefined });
  }
}

export function zonedMoment(date: Date | number, timeZone?: string): moment.Moment {
  return timeZone ? moment.tz(date, timeZone) : moment(date);
}

// Browser-local Date whose fields show the zone's wall clock, for pickers that work in local time
export function toWallClock(instant: Date, timeZone: string): Date {
  const m = moment.tz(instant, timeZone);
  return new Date(m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second());
}

export function fromWallClock(wallClock: Date, timeZone: string): Date {
  const w = wallClock;
  return moment
    .tz([w.getFullYear(), w.getMonth(), w.getDate(), w.getHours(), w.getMinutes(), w.getSeconds()], timeZone)
    .toDate();
}

export function formatDayKey(instant: Date, timeZone: string): string {
  return moment.tz(instant, timeZone).format('YYYY-MM-DD');
}

export function getSupportedTimezones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    if (zones.length > 0) return zones;
  } catch {}
  // ICU-independent list for the broken-Intl case
  return moment.tz.names();
}
