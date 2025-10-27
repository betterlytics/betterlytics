'use client';

import { Sigma, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

type TimeseriesToggleButtonProps = {
  isTimeseries: boolean;
  onToggle: () => void;
  className?: string;
};

export function TimeseriesToggleButton({ isTimeseries, onToggle, className }: TimeseriesToggleButtonProps) {
  const t = useTranslations('components.geography.mapType');

  const Icon = isTimeseries ? Sigma : Video;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      onClick={onToggle}
      title={t(`${isTimeseries ? 'accumulated' : 'timeseries'}.tooltip`)}
      className={cn(
        'flex w-28 flex-col px-3 py-1.5 text-sm',
        'bg-secondary hover:bg-accent cursor-pointer rounded-md',
        'border-border border shadow-sm',
        className,
      )}
    >
      <span className='font-mono text-xs font-light'>
        {t(`${isTimeseries ? 'accumulated' : 'timeseries'}.label`)}
      </span>
      {<Icon className='mx-auto h-4 w-4' />}
    </motion.button>
  );
}
