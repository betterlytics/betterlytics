'use client';

import { memo, useEffect, useState } from 'react';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { useReducedMotion } from 'motion/react';
import { Gauge, getGaugeBox } from '@/components/gauge';
import { MOCK_CORE_WEB_VITAL_VALUES } from '@/constants/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { getCoreWebVitalGaugeProps, getCoreWebVitalIntlFormat, getCoreWebVitalLevel } from '@/utils/coreWebVitals';
import { COPY, COPY_LOCALE } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import type { IllustrationProps } from './types';
import styles from './vitals.module.css';

/*
 * The dashboard's own gauges, as the old landing card draws them: threshold
 * segments outside, the value arc inside, the number rolling as it changes.
 * Each gauge steps through the shared mock values on its own interval, so
 * they never move in step.
 */

const SIZE = 150;
const STROKE = 7.7;
const ARC_GAP = 3;
const BOX = getGaugeBox({ size: SIZE, strokeWidth: STROKE });

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

const LEGEND = [
  { label: 'Good', swatch: 'bg-(--cwv-threshold-good)' },
  { label: 'Needs work', swatch: 'bg-(--cwv-threshold-fair)' },
  { label: 'Poor', swatch: 'bg-(--cwv-threshold-poor)' },
] as const;

const MetricGauge = memo(function MetricGauge({
  metric,
  value,
  drawn,
}: {
  metric: CoreWebVitalName;
  value: number;
  drawn: boolean;
}) {
  const { segments, progress } = getCoreWebVitalGaugeProps(metric, value);
  const format = getCoreWebVitalIntlFormat(metric, value);
  return (
    <div className={styles.slot}>
      {/* the unfilled track inside the gauge is drawn in currentColor */}
      <Gauge
        className='text-fg'
        segments={segments}
        progress={drawn ? progress : 0}
        size={SIZE}
        strokeWidth={STROKE}
        arcGap={ARC_GAP}
      >
        <div className='absolute inset-x-0 bottom-[20%] flex flex-col items-center'>
          {/* the metric's name: firm grey, second to the coloured value; a little tracking, not eyebrow-wide */}
          <span className='-mb-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted'>{metric}</span>
          <span className={styles.value} data-level={getCoreWebVitalLevel(metric, value)}>
            <NumberFlow value={format.value} format={format.format} locales={COPY_LOCALE} willChange />
            {format.suffix && <span key={format.suffix}>{format.suffix}</span>}
          </span>
        </div>
      </Gauge>
    </div>
  );
});

/** One gauge stepping through its metric's mock values while the card is live. */
function CyclingGauge({
  metric,
  intervalMs,
  startIndex,
  entered,
  live,
}: {
  metric: CoreWebVitalName;
  intervalMs: number;
  startIndex: number;
  entered: boolean;
  live: boolean;
}) {
  const reduce = useReducedMotion();
  const values = MOCK_CORE_WEB_VITAL_VALUES[metric];
  const [index, setIndex] = useState(startIndex % values.length);

  useEffect(() => {
    if (!live || reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % values.length), intervalMs);
    return () => clearInterval(id);
  }, [live, reduce, intervalMs, values.length]);

  return <MetricGauge metric={metric} value={values[index]} drawn={entered} />;
}

/**
 * The gauges are mock values, not anyone's data, so they are art: one image to
 * assistive tech, labelled with what it shows, with the art inside hidden.
 */
export function Vitals({ entered, live }: IllustrationProps) {
  return (
    <div
      className={cn(
        styles.root,
        'absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-[30px] py-6',
      )}
      style={vars({ '--box-w': `${BOX.width}px`, '--box-h': `${BOX.height}px` })}
      role='img'
      aria-label={COPY.illustrations.vitals}
    >
      <NumberFlowGroup>
        {ROWS.map((row, r) => (
          <div key={r} className='flex justify-center gap-[30px] max-md:gap-[11px]' aria-hidden>
            {row.map((g) => (
              <CyclingGauge
                key={g.key}
                metric={g.key}
                intervalMs={g.intervalMs}
                startIndex={g.startIndex}
                entered={entered}
                live={live}
              />
            ))}
          </div>
        ))}
      </NumberFlowGroup>
      {/* a key, not content: secondary grey, legible without competing with the values */}
      <div className='mt-3.5 flex justify-center gap-7 text-code text-muted' aria-hidden>
        {LEGEND.map(({ label, swatch }) => (
          <span key={label} className='inline-flex items-center gap-[7px]'>
            <span className={cn('size-2 flex-none rounded-full', swatch)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
