import type { useTranslations } from 'next-intl';

type MonitoringPageTranslation = ReturnType<typeof useTranslations<'monitoringPage'>>;

export function formatIntervalLabel(t: MonitoringPageTranslation, intervalSeconds?: number | null): string {
  if (intervalSeconds == null || Number.isNaN(intervalSeconds)) return '—';
  if (intervalSeconds % 60 === 0) {
    const mins = intervalSeconds / 60;
    return t('list.intervalMinutes', { value: mins });
  }
  return t('list.intervalSeconds', { value: intervalSeconds });
}

export function isHttpUrl(url: string): boolean {
  return !url.startsWith('https://');
}

export function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function formatSslTimeRemaining(
  expiryDate: string | Date | null | undefined,
): { value: number; unit: 'days' | 'hours' } | null {
  if (expiryDate == null) return null;

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  if (Number.isNaN(expiry.getTime())) return null;

  const nowMs = Date.now();
  const diffMs = expiry.getTime() - nowMs;
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return { value: diffDays, unit: 'days' };
  }

  return { value: diffHours, unit: 'hours' };
}
