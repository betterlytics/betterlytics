'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale, useTranslations } from 'next-intl';
import { Gauge } from '@/components/gauge';
import {
  getCoreWebVitalGaugeProps,
  getCoreWebVitalLabelColor,
  getCoreWebVitalIntlFormat,
  CORE_WEB_VITAL_LEVELS,
} from '@/utils/coreWebVitals';
import { MOCK_CORE_WEB_VITAL_VALUES } from '@/constants/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';

type MetricGaugeProps = {
  metric: { key: CoreWebVitalName; value: number };
  locale: SupportedLanguages;
};

const MetricGauge = memo(function MetricGauge({ metric, locale }: MetricGaugeProps) {
  const { segments, progress } = getCoreWebVitalGaugeProps(metric.key, metric.value);
  const { value, format, suffix } = getCoreWebVitalIntlFormat(metric.key, metric.value);

  return (
    <Gauge
      role='group'
      aria-label={`${metric.key} metric`}
      className='shrink-0'
      segments={segments}
      progress={progress}
      size={115}
      strokeWidth={6}
      arcGap={2.5}
    >
      <div className='absolute right-0 bottom-[20%] left-0 flex flex-col items-center'>
        <span className='text-muted-foreground/75 -mb-1 font-sans text-[8px] font-black tracking-[0.25em] uppercase'>
          {metric.key}
        </span>
        <span
          className='font-semibold tracking-tight tabular-nums drop-shadow-sm'
          style={{
            color: getCoreWebVitalLabelColor(metric.key, metric.value),
            ['--number-flow-char-height' as string]: '1em',
          }}
        >
          <NumberFlow value={value} format={format} locales={locale} willChange />
          {suffix && (
            <span key={suffix} className='animate-in fade-in duration-700'>
              {suffix}
            </span>
          )}
        </span>
      </div>
    </Gauge>
  );
});

const GAUGE_CONFIGS: readonly { key: CoreWebVitalName; intervalMs: number; startIndex: number }[] = [
  { key: 'LCP', intervalMs: 5300, startIndex: 0 },
  { key: 'INP', intervalMs: 7200, startIndex: 2 },
  { key: 'CLS', intervalMs: 8300, startIndex: 4 },
  { key: 'FCP', intervalMs: 6400, startIndex: 1 },
  { key: 'TTFB', intervalMs: 9300, startIndex: 3 },
];

function StaggeredMetricGauge({
  metricKey,
  intervalMs,
  startIndex,
  locale,
}: {
  metricKey: CoreWebVitalName;
  intervalMs: number;
  startIndex: number;
  locale: SupportedLanguages;
}) {
  const values = MOCK_CORE_WEB_VITAL_VALUES[metricKey];
  const [currentIndex, setCurrentIndex] = useState(startIndex % values.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % values.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, values.length]);

  return <MetricGauge metric={{ key: metricKey, value: values[currentIndex] }} locale={locale} />;
}

function AnimatedGaugeGrid() {
  const locale = useLocale();

  return (
    <NumberFlowGroup>
      <div
        className='flex w-full flex-wrap justify-evenly gap-4'
        style={{ ['--number-flow-duration' as string]: '700ms' }}
      >
        {GAUGE_CONFIGS.map((config) => (
          <StaggeredMetricGauge
            key={config.key}
            metricKey={config.key}
            intervalMs={config.intervalMs}
            startIndex={config.startIndex}
            locale={locale}
          />
        ))}
      </div>
    </NumberFlowGroup>
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
          {CORE_WEB_VITAL_LEVELS.map((label) => (
            <div className='flex items-center gap-1' key={label}>
              <span
                className='inline-block h-2 w-2 rounded-full'
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
