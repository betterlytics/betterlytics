'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Gauge } from '@/components/gauge';
import { getCwvGaugeProps, getCwvLabelColor, CWV_LEVELS } from '@/utils/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import NumberFlow from '@number-flow/react';

// 5 variations cycling through good → fair → poor ranges
// Thresholds: LCP [2500,4000], INP [200,500], CLS [0.1,0.25], FCP [1800,3000], TTFB [800,1800]
const metrics: { key: CoreWebVitalName; value: number }[][] = [
  // Variation 1: All good (green)
  [
    { key: 'LCP', value: 1200 },
    { key: 'INP', value: 80 },
    { key: 'CLS', value: 0.03 },
    { key: 'FCP', value: 1000 },
    { key: 'TTFB', value: 400 },
  ],
  // Variation 2: Mostly good, one fair
  [
    { key: 'LCP', value: 1800 },
    { key: 'INP', value: 350 },
    { key: 'CLS', value: 0.05 },
    { key: 'FCP', value: 1400 },
    { key: 'TTFB', value: 750 },
  ],
  // Variation 3: Mixed fair
  [
    { key: 'LCP', value: 3200 },
    { key: 'INP', value: 450 },
    { key: 'CLS', value: 0.15 },
    { key: 'FCP', value: 2200 },
    { key: 'TTFB', value: 1200 },
  ],
  // Variation 4: Some poor (red)
  [
    { key: 'LCP', value: 4500 },
    { key: 'INP', value: 550 },
    { key: 'CLS', value: 0.08 },
    { key: 'FCP', value: 2800 },
    { key: 'TTFB', value: 2000 },
  ],
  // Variation 5: More poor (red)
  [
    { key: 'LCP', value: 2800 },
    { key: 'INP', value: 600 },
    { key: 'CLS', value: 0.3 },
    { key: 'FCP', value: 3500 },
    { key: 'TTFB', value: 600 },
  ],
];

// Use consistent units per metric to avoid unit switching during animation
// LCP/FCP/TTFB: always seconds
// INP: always milliseconds (values typically < 600ms)
const useSecondsUnit = (key: CoreWebVitalName) => key === 'LCP' || key === 'FCP' || key === 'TTFB';

const MetricGauge = memo(function MetricGauge({ metric }: { metric: { key: CoreWebVitalName; value: number } }) {
  const { segments, progress } = getCwvGaugeProps(metric.key, metric.value);
  const color = getCwvLabelColor(metric.key, metric.value);
  const isCLS = metric.key === 'CLS';
  const useSeconds = useSecondsUnit(metric.key);

  return (
    <div role='group' aria-label={`${metric.key} metric`}>
      <Gauge segments={segments} progress={progress} size={115} strokeWidth={6} arcGap={2.5}>
        <div className={'absolute right-0 bottom-[20%] left-0 flex flex-col items-center'}>
          <span className='text-muted-foreground/75 -mb-1 font-sans text-[8px] font-black tracking-[0.25em] uppercase'>
            {metric.key}
          </span>
          <span
            className='font-semibold tracking-tight tabular-nums drop-shadow-sm'
            style={{ color, ['--number-flow-char-height' as string]: '1em' }}
          >
            {isCLS ? (
              <NumberFlow
                value={metric.value}
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 3 }}
                willChange
              />
            ) : (
              <NumberFlow
                value={useSeconds ? metric.value / 1000 : metric.value}
                format={{
                  style: 'unit',
                  unit: useSeconds ? 'second' : 'millisecond',
                  unitDisplay: 'narrow',
                  maximumFractionDigits: useSeconds ? 1 : 0,
                }}
                willChange
              />
            )}
          </span>
        </div>
      </Gauge>
    </div>
  );
});

function AnimatedGaugeGrid() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % metrics.length);
    }, 6_000);
    return () => clearInterval(interval);
  }, []);

  const currentMetrics = metrics[currentIndex];

  return (
    <div className='space-y-6' style={{ ['--number-flow-duration' as string]: '700ms' }}>
      <div className='grid grid-cols-2 place-items-center gap-2 sm:gap-0 sm:px-3'>
        {currentMetrics.slice(0, 2).map((m) => (
          <MetricGauge key={m.key} metric={m} />
        ))}
      </div>
      <div className='grid grid-cols-2 place-items-center gap-4 md:grid-cols-3'>
        {currentMetrics.slice(2).map((m) => (
          <div key={m.key} className={m.key === 'TTFB' ? 'hidden md:block' : ''}>
            <MetricGauge metric={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoreWebVitalsCard() {
  const t = useTranslations('public.landing.cards.coreWebVitals');
  const tMisc = useTranslations('misc');

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative gap-0 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='flex min-h-0 flex-1 flex-col pt-6'>
        <div className='flex flex-1 items-center justify-center'>
          <AnimatedGaugeGrid />
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
