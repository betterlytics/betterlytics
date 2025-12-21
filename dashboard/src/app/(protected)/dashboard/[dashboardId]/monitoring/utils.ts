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
