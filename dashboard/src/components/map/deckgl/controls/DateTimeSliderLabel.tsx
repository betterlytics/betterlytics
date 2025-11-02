'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { GranularityRangeValues } from '@/utils/granularityRanges';
import { MotionText } from '@/components/animation/MotionText';

const formatDate = (date: Date, granularity: GranularityRangeValues) =>
  date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: granularity === 'day' ? undefined : '2-digit',
    minute: granularity === 'day' ? undefined : '2-digit',
  });

export type DateTimeSliderLabelProps = {
  value: Date;
  granularity: GranularityRangeValues;
  animate?: boolean;
} & React.ComponentProps<'span'>;

function DateTimeSliderLabelComponent({
  value,
  granularity,
  animate = true,
  className,
  ...rest
}: DateTimeSliderLabelProps) {
  const formatted = formatDate(value, granularity);

  return animate ? (
    <MotionText
      text={formatted}
      className={cn(className, 'inline-flex')}
      charClassName='w-[1ch] text-center tabular-nums select-none'
      y={6}
      duration={0.2}
      {...rest}
    />
  ) : (
    <span className={cn(className, 'inline-flex')} {...rest}>
      {formatted}
    </span>
  );
}

const DateTimeSliderLabel = React.memo(DateTimeSliderLabelComponent);
DateTimeSliderLabel.displayName = 'DateTimeSliderLabel';
export default DateTimeSliderLabel;
