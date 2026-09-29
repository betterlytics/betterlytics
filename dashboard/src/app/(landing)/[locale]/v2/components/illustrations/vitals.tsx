'use client';

import { memo, useEffect, useState } from 'react';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { useLocale } from 'next-intl';
import { Gauge } from '@/components/gauge';
import { MOCK_CORE_WEB_VITAL_VALUES } from '@/constants/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import {
  getCoreWebVitalGaugeProps,
  getCoreWebVitalIntlFormat,
  getCoreWebVitalLabelColor,
} from '@/utils/coreWebVitals';
import type { IllustrationProps } from './types';
import { useReducedMotion } from '@/landing/hooks/useReducedMotion';

/*
 * The dashboard's own gauges, as the old landing card draws them: threshold
 * segments outside, the value arc inside, the number rolling as it changes.
 * Each gauge steps through the shared mock values on its own interval, so
 * they never move in step.
 */

const SIZE = 150;
const STROKE = 7.7;
const ARC_GAP = 3;

const ROWS: ReadonlyArray<ReadonlyArray<{ key: CoreWebVitalName; intervalMs: number; startIndex: number }>> = [
  [
    { key: 'FCP', intervalMs: 6400, startIndex: 1 },
    { key: 'TTFB', intervalMs: 9300, startIndex: 3 },
  ],
  [
    { key: 'LCP', intervalMs: 5300, startIndex: 0 },
    { key: 'INP', intervalMs: 7200, startIndex: 2 },
    { key: 'CLS', intervalMs: 8300, startIndex: 4 },
  ],
];

const MetricGauge = memo(function MetricGauge({
  metric,
  value,
  drawn,
  locale,
}: {
  metric: CoreWebVitalName;
  value: number;
  drawn: boolean;
  locale: string;
}) {
  const { segments, progress } = getCoreWebVitalGaugeProps(metric, value);
  const format = getCoreWebVitalIntlFormat(metric, value);
  return (
    <Gauge
      role='group'
      aria-label={`${metric} metric`}
      className='gg__u'
      segments={segments}
      progress={drawn ? progress : 0}
      size={SIZE}
      strokeWidth={STROKE}
      arcGap={ARC_GAP}
    >
      <div className='gg__c'>
        <span className='gg__k'>{metric}</span>
        <span className='gg__v' style={{ color: getCoreWebVitalLabelColor(metric, value) }}>
          <NumberFlow value={format.value} format={format.format} locales={locale} willChange />
          {format.suffix && <span key={format.suffix}>{format.suffix}</span>}
        </span>
      </div>
    </Gauge>
  );
});

/** One gauge stepping through its metric's mock values while the card is live. */
function CyclingGauge({
  metric,
  intervalMs,
  startIndex,
  entered,
  live,
  locale,
}: {
  metric: CoreWebVitalName;
  intervalMs: number;
  startIndex: number;
  entered: boolean;
  live: boolean;
  locale: string;
}) {
  const reduce = useReducedMotion();
  const values = MOCK_CORE_WEB_VITAL_VALUES[metric];
  const [index, setIndex] = useState(startIndex % values.length);

  useEffect(() => {
    if (!live || reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % values.length), intervalMs);
    return () => clearInterval(id);
  }, [live, reduce, intervalMs, values.length]);

  return <MetricGauge metric={metric} value={values[index]} drawn={entered} locale={locale} />;
}

export function Vitals({ entered, live }: IllustrationProps) {
  const locale = useLocale();
  return (
    <div className='gg'>
      <NumberFlowGroup>
        {ROWS.map((row, r) => (
          <div key={r} className='gg__row'>
            {row.map((g) => (
              <CyclingGauge
                key={g.key}
                metric={g.key}
                intervalMs={g.intervalMs}
                startIndex={g.startIndex}
                entered={entered}
                live={live}
                locale={locale}
              />
            ))}
          </div>
        ))}
      </NumberFlowGroup>
      <div className='gg__lg'>
        <span>
          <i style={{ background: 'var(--cwv-threshold-good)' }} />
          Good
        </span>
        <span>
          <i style={{ background: 'var(--cwv-threshold-fair)' }} />
          Needs work
        </span>
        <span>
          <i style={{ background: 'var(--cwv-threshold-poor)' }} />
          Poor
        </span>
      </div>
    </div>
  );
}
