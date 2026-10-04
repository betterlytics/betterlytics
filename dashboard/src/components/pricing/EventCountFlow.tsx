'use client';

import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useLocale } from 'next-intl';
import { compactEventParts } from '@/utils/pricing';

/** A rolling event count. Its digits spin the way the count moved, since 500K → 1M is 500 → 1 once scaled. */
export function EventCountFlow({ value, className }: { value: number; className?: string }) {
  const locale = useLocale();
  const [previous, setPrevious] = useState(value);
  const [trend, setTrend] = useState(0);
  if (value !== previous) {
    setPrevious(value);
    setTrend(Math.sign(value - previous));
  }
  const { scaled, suffix } = compactEventParts(value, locale);

  return (
    <NumberFlow className={className} value={scaled} locales={locale} suffix={suffix} trend={trend} willChange />
  );
}
