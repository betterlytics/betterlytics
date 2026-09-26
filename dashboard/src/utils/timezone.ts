import moment from 'moment-timezone';

export const FALLBACK_TIMEZONE = 'Etc/UTC';

export type TimezoneSource = 'setting' | 'browser' | 'fallback';

// The zone's correctly cased name, or null when unknown. Checked against moment's zone data, not Intl:
// the server's ICU can lag behind tzdata, and Intl accepts letter cases ClickHouse rejects
export function normalizeTimezone(tz: unknown): string | null {
  return (typeof tz === 'string' && moment.tz.zone(tz)?.name) || null;
}

export function detectBrowserTimezone(): string | null {
  try {
    // Some browsers with broken ICU report undefined or 'Etc/Unknown' here
    return normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return null;
  }
}

export function resolveTimezone(
  setting: string | null | undefined,
  browser: string | null,
): { timeZone: string; source: TimezoneSource } {
  const settingZone = normalizeTimezone(setting);
  if (settingZone) return { timeZone: settingZone, source: 'setting' };
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

// The instant showing the same wall clock in another zone
export function keepWallClock(instant: Date, from: string, to: string): Date {
  return moment.tz(instant, from).tz(to, true).toDate();
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
