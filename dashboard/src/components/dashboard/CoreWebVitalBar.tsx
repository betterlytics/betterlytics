'use client';

import React from 'react';
import { CoreWebVitalName } from '@/entities/webVitals';

type Props = {
  metric: CoreWebVitalName;
  value: number; // ms for non-CLS, raw for CLS
  thresholds: Partial<Record<CoreWebVitalName, number[]>>;
};

export default function CoreWebVitalBar({ metric, value, thresholds }: Props) {
  const [good, ni] = thresholds[metric] ?? [];

  // Bar is 100% width; segments are 0..good, good..ni, ni..max.
  // Reserve a small red tail (~8%) so users can see proximity to "poor" even when value < NI.
  // If value exceeds the planned domain, the tail expands naturally.
  const redTailFraction = 0.08;
  const baseMax = ni ?? good ?? value;
  let maxDomain = baseMax / (1 - redTailFraction);
  if (value > maxDomain) maxDomain = value;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const markerPos = clamp(value / (maxDomain || 1), 0, 1) * 100;
  const goodWidth = good ? clamp(good / (maxDomain || 1), 0, 1) * 100 : 0;
  const niWidth = ni && good ? clamp((ni - good) / (maxDomain || 1), 0, 1) * 100 : 0;
  const poorWidth = clamp(100 - goodWidth - niWidth, 0, 100);

  return (
    <div className='space-y-1'>
      <div className='bg-muted/30 relative h-2 w-full rounded-sm'>
        {goodWidth > 0 && (
          <div
            className='absolute top-0 left-0 h-full rounded-l-sm'
            style={{ width: `${goodWidth}%`, backgroundColor: 'var(--cwv-threshold-good)' }}
          />
        )}
        {niWidth > 0 && (
          <div
            className='absolute top-0 h-full'
            style={{ left: `${goodWidth}%`, width: `${niWidth}%`, backgroundColor: 'var(--cwv-threshold-ni)' }}
          />
        )}
        {poorWidth > 0 && (
          <div
            className='absolute top-0 right-0 h-full rounded-r-sm'
            style={{
              left: `${goodWidth + niWidth}%`,
              width: `${poorWidth}%`,
              backgroundColor: 'var(--cwv-threshold-poor)',
            }}
          />
        )}
        <div
          className='absolute h-2 w-2 rounded-full'
          style={{
            left: `${markerPos}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'currentColor',
            boxShadow: '0 0 0 2px var(--card), 0 1px 4px rgba(0, 0, 0, 0.4)',
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
