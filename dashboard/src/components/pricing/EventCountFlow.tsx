'use client';

import { Fragment, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useLocale } from 'next-intl';
import { compactEventParts } from '@/utils/pricing';

/** Cancels NumberFlow's mask padding so a figure lays out like text. */
export const FLUSH = '[--number-flow-mask-height:0.25em] -my-(--number-flow-mask-height)';

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Half NumberFlow's 900 ms default, so a jump across several slider stops settles quickly. */
export const QUICK_ROLL = {
  transformTiming: { duration: 450, easing: EASE_OUT },
  spinTiming: { duration: 450, easing: EASE_OUT },
  opacityTiming: { duration: 250, easing: 'ease-out' },
} as const;

/** Digits spin the way the count moved, since 500K → 1M is 500 → 1 once scaled. */
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
    <NumberFlow
      className={className}
      value={scaled}
      locales={locale}
      suffix={suffix}
      trend={trend}
      willChange
      {...QUICK_ROLL}
    />
  );
}

export function EventCountText({ text, figure, events }: { text: string; figure: string; events: number }) {
  return (
    <>
      {text.split(figure).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <EventCountFlow value={events} />}
          {part}
        </Fragment>
      ))}
    </>
  );
}
