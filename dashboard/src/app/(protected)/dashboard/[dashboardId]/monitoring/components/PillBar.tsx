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
import { Label } from '@/components/ui/label';

type PillBarProps = {
  data?: MonitorUptimeBucket[];
};

export function PillBar({ data }: PillBarProps) {
  const locale = useLocale();
  const t = useTranslations('monitoring.labels');
  const normalized = data ?? [];

  if (normalized.length === 0) {
    return null;
  }

  return (
    <div className='border-border/60 bg-background/30 mt-2 flex w-full flex-nowrap gap-[4px] overflow-hidden rounded-md border p-2'>
      {normalized.map((point) => {
        const upRatio = point.upRatio ?? null;
        const isPlaceholder = upRatio == null;
        const bucketLabel = defaultDateLabelFormatter(point.bucket, 'hour', locale);
        const label = isPlaceholder
          ? t('noData')
          : `${formatPercentage(upRatio * 100, 2, { trimHundred: true })} ${t('uptimeSuffix')}`;
        const toneClass = (() => {
          if (isPlaceholder) return `${MONITOR_TONE.neutral.solid} border border-border/40`;
          const { theme } = presentUptimeTone(upRatio * 100);
          return theme.solid;
        })();
        return (
          <MonitoringTooltip key={point.bucket} title={bucketLabel} description={label}>
            <Label className={`h-5 min-w-0 flex-1 rounded-sm ${toneClass}`} aria-label={label} />
          </MonitoringTooltip>
        );
      })}
    </div>
  );
}
