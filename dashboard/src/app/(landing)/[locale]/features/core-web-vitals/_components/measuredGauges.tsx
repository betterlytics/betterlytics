'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { VitalGauge } from '@/landing/components/ui/vitalGauge';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { BREAKDOWN } from './vitalsData';
import styles from './blindSpot.module.css';

const PAGE = BREAKDOWN.pages.find((row) => row.key === '/checkout')!;
const VITALS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;
const GAUGE = { size: 136, strokeWidth: 7, arcGap: 2.75 };

/** The checkout's five metrics, drawn as the dashboard's gauges, each named in plain words. */
export function MeasuredGauges() {
  const t = useTranslations('landing.vitals.blindSpot');
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref);
  return (
    <div ref={ref} className={styles.gauges} style={vars({ '--gauge': `${GAUGE.size}px` })} aria-hidden>
      {VITALS.map((metric) => (
        <div key={metric} className={styles.gauge}>
          <VitalGauge metric={metric} value={PAGE.p75[metric]} drawn={entered} {...GAUGE} />
          <span>{t(`vitals.${metric}`)}</span>
        </div>
      ))}
    </div>
  );
}
