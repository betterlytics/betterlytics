import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { Gauge } from '@/components/gauge';
import { getCwvGaugeProps, getCwvLabelColor, formatCWV, CWV_LEVELS } from '@/utils/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { cn } from '@/lib/utils';

const metrics: { key: CoreWebVitalName; value: number }[] = [
  { key: 'LCP', value: 1800 },
  { key: 'INP', value: 350 },
  { key: 'CLS', value: 0.05 },
  { key: 'FCP', value: 1400 },
  { key: 'TTFB', value: 750 },
];

const MetricGauge = ({ metric }: { metric: { key: CoreWebVitalName; value: number } }) => {
  const { segments, progress } = getCwvGaugeProps(metric.key, metric.value);

  return (
    <div role='group' aria-label={`${metric.key} metric`}>
      <Suspense>
        <Gauge segments={segments} progress={progress} size={115} strokeWidth={6} arcGap={2.5}>
          <div className={'pointer-events-none absolute right-0 bottom-[20%] left-0 flex flex-col items-center'}>
            <span className='text-muted-foreground/75 -mb-1 font-sans text-[8px] font-black tracking-[0.25em] uppercase'>
              {metric.key}
            </span>
            <span
              className='font-semibold tracking-tight drop-shadow-sm'
              style={{ color: getCwvLabelColor(metric.key, metric.value) }}
            >
              {formatCWV(metric.key, metric.value)}
            </span>
          </div>
        </Gauge>
      </Suspense>
    </div>
  );
};

export default async function CoreWebVitalsCard() {
  const t = await getTranslations('public.landing.cards.coreWebVitals');
  const tMisc = await getTranslations('misc');

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative gap-0 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='flex min-h-0 flex-1 flex-col pt-6'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='space-y-6'>
            <div className='grid grid-cols-2 place-items-center gap-2 sm:gap-0 sm:px-3'>
              {metrics.slice(0, 2).map((m) => (
                <MetricGauge key={m.key} metric={m} />
              ))}
            </div>
            <div className='grid grid-cols-2 place-items-center gap-4 md:grid-cols-3'>
              {metrics.slice(2).map((m) => (
                <div key={m.key} className={m.key === 'TTFB' ? 'hidden md:block' : ''}>
                  <MetricGauge metric={m} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='text-muted-foreground mt-auto flex items-center justify-center gap-10 pt-4 text-xs'>
          {CWV_LEVELS.map((label) => (
            <div className='flex items-center gap-1' key={label}>
              <span
                className={`inline-block h-2 w-2 rounded-full`}
                style={{ backgroundColor: `var(--cwv-threshold-${label})` }}
              />
              <span aria-label={tMisc(label)}>{tMisc(label)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
