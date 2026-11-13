'use client';

import { memo } from 'react';
import NumberFlow from '@number-flow/react';
import { useLocale } from 'next-intl';
import { Gauge } from '@/components/gauge';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import {
  formatCWV,
  getCoreWebVitalGaugeProps,
  getCoreWebVitalIntlFormat,
  getCoreWebVitalLevel,
} from '@/utils/coreWebVitals';
import { vars } from '@/landing/lib/cssVars';
import styles from './vitalGauge.module.css';

type VitalGaugeProps = {
  metric: CoreWebVitalName;
  value: number | null;
  size: number;
  strokeWidth: number;
  arcGap: number;
  /** Off holds the needle at zero, for an entrance. */
  drawn?: boolean;
};

/** The dashboard's metric gauge; its colours come from a `vitalLevels` ancestor. */
export const VitalGauge = memo(function VitalGauge({
  metric,
  value,
  size,
  strokeWidth,
  arcGap,
  drawn = true,
}: VitalGaugeProps) {
  const locale = useLocale();
  const { segments, progress } = getCoreWebVitalGaugeProps(metric, value);
  const format = value === null ? null : getCoreWebVitalIntlFormat(metric, value);
  return (
    // sets the track colour, drawn in currentColor
    <Gauge
      className='text-fg'
      segments={segments}
      progress={drawn ? progress : 0}
      size={size}
      strokeWidth={strokeWidth}
      arcGap={arcGap}
    >
      <div className='absolute inset-x-0 bottom-[20%] flex flex-col items-center'>
        <span className='-mb-0.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted'>{metric}</span>
        <span
          className={styles.value}
          data-level={getCoreWebVitalLevel(metric, value)}
          style={vars({ '--size': `${size}px` })}
        >
          <span className='sr-only'>{formatCWV(metric, value, locale)}</span>
          <span className={styles.flow} aria-hidden>
            {format ? (
              <>
                <NumberFlow value={format.value} format={format.format} locales={locale} willChange />
                {format.suffix && <span key={format.suffix}>{format.suffix}</span>}
              </>
            ) : (
              '—'
            )}
          </span>
        </span>
      </div>
    </Gauge>
  );
});
