'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatPercentage } from '@/utils/formatters';
import { defaultDateLabelFormatter } from '@/utils/chartUtils';
import {
  MONITOR_TONE,
  presentUptimeTone,
} from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';
import { MonitoringTooltip } from '../[monitorId]/MonitoringTooltip';
import { type MonitorUptimeBucket } from '@/entities/analytics/monitoring.entities';

type PillBarProps = {
  data?: MonitorUptimeBucket[];
};

export function PillBar({ data }: PillBarProps) {
  const locale = useLocale();
  const t = useTranslations('monitoring.labels');

  const normalized = data ?? [];
  if (normalized.length === 0) return null;

  const getLabel = (upRatio: number | null) => {
    if (upRatio == null) return t('noData');
    return `${formatPercentage(upRatio * 100, 2, { trimHundred: true })} ${t('uptimeSuffix')}`;
  };

  const getToneClass = (upRatio: number | null) => {
    if (upRatio == null) return `${MONITOR_TONE.neutral.solid} border border-border/40`;
    return presentUptimeTone(upRatio * 100).theme.solid;
  };

  return (
    <div className='border-border/60 bg-background/30 mt-2 flex w-full flex-nowrap gap-[4px] overflow-hidden rounded-md border p-2'>
      {normalized.map((point) => {
        const upRatio = point.upRatio ?? null;
        const bucketLabel = defaultDateLabelFormatter(point.bucket, 'hour', locale);
        const label = getLabel(upRatio);
        const toneClass = getToneClass(upRatio);

        return (
          <MonitoringTooltip key={point.bucket} title={bucketLabel} description={label}>
            <span
              className={`hover:ring-foreground/30 h-5 min-w-0 flex-1 rounded-sm transition-shadow hover:ring-1 ${toneClass}`}
              aria-label={label}
            />
          </MonitoringTooltip>
        );
      })}
    </div>
  );
}
