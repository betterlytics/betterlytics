'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

const formatDate = (date: Date, granularity: GranularityRangeValues) =>
  date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: granularity === 'day' ? undefined : '2-digit',
    minute: granularity === 'day' ? undefined : '2-digit',
  });

export type DateTimeSliderLabelProps = {
  value: Date;
  granularity: GranularityRangeValues;
} & React.ComponentProps<'span'>;

export function DateTimeSliderLabel({ value, granularity, className, ...rest }: DateTimeSliderLabelProps) {
  const formatted = formatDate(value, granularity);

  // Split into single characters
  const chars = Array.from(formatted);

  return (
    <span className={cn('inline-flex gap-[0.05em] font-mono', className)} {...rest}>
      {chars.map((char, index) => (
        <AnimatePresence mode='wait' key={`${char}-${index}`}>
          <motion.span
            key={char}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='inline-block w-[1ch] text-center tabular-nums select-none'
          >
            {char}
          </motion.span>
        </AnimatePresence>
      ))}
    </span>
  );
}
