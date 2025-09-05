'use client';

import { Info } from 'lucide-react';
import { TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { formatCWV } from '@/utils/formatters';
import type { CoreWebVitalName } from '@/entities/webVitals';
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
      <TooltipPrimitive.Root>
        <TooltipTrigger asChild>
          <button
            type='button'
            aria-label={t('info.aboutMetricAria')}
            className={triggerClassName || 'text-muted-foreground hover:text-foreground'}
          >
            <Info className={iconClassName} />
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          <div className='max-w-[260px] space-y-2'>
            <p className='text-primary-foreground/90'>{t(`info.descriptions.${metric}`)}</p>
            <div className='bg-primary-foreground/20 h-px' />
            <div className='text-[11px] leading-4'>
              <div>
                <span className='opacity-80'>{t('info.good')}:</span> ≤{' '}
                {formatCWV(metric, CWV_THRESHOLDS[metric][0])}
              </div>
              <div>
                <span className='opacity-80'>{t('info.needsImprovement')}:</span> ≤{' '}
                {formatCWV(metric, CWV_THRESHOLDS[metric][1])}
              </div>
            </div>
          </div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
