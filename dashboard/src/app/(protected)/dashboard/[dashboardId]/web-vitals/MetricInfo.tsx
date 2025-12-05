'use client';

import { Info } from 'lucide-react';
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { formatCWV } from '@/utils/formatters';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals';
import { useTranslations } from 'next-intl';

type MetricInfoProps = {
  metric: CoreWebVitalName;
  iconClassName?: string;
  triggerClassName?: string;
};

export default function MetricInfo({ metric, iconClassName = 'h-4 w-4', triggerClassName }: MetricInfoProps) {
  const t = useTranslations('components.webVitals');
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            aria-label={t('info.aboutMetricAria')}
            className={triggerClassName || 'text-muted-foreground hover:text-foreground'}
          >
            <Info className={iconClassName} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side='bottom'
          className='border-border bg-popover/95 text-popover-foreground rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
        >
          <div className='max-w-[260px] space-y-2'>
            <p className='text-popover-foreground/90'>{t(`info.descriptions.${metric}`)}</p>
            <Separator className='bg-popover-foreground/20' />
            <div className='text-[11px] leading-4'>
              <div>
                <span className='opacity-80'>{t('info.good')}:</span> ≤{' '}
                {formatCWV(metric, CWV_THRESHOLDS[metric][0])}
              </div>
              <div>
                <span className='opacity-80'>{t('info.fair')}:</span> ≤{' '}
                {formatCWV(metric, CWV_THRESHOLDS[metric][1])}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
