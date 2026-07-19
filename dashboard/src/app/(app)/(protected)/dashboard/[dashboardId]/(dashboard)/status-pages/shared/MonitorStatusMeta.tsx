'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatters';
import { presentMonitorStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import type { MonitorRow } from './monitorRow';

export function MonitorStatusMeta({ row }: { row: MonitorRow }) {
  const tStatus = useTranslations('monitoring.status');
  const locale = useLocale();
  const presentation = row.operationalState ? presentMonitorStatus(row.operationalState) : null;

  return (
    <div className='flex flex-none items-center gap-2'>
      <span className='text-muted-foreground w-12 text-right text-xs font-medium tabular-nums'>
        {row.uptimePercent != null &&
          formatPercentage(row.uptimePercent, locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            trimHundred: true,
          })}
      </span>
      {presentation && (
        <span
          className={cn('h-2.5 w-2.5 rounded-full', presentation.theme.dot)}
          title={tStatus(presentation.labelKey)}
          aria-label={tStatus(presentation.labelKey)}
        />
      )}
    </div>
  );
}
