'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import MapTooltipTip from '../../tooltip/MapTooltipTip';

export type TimeSliderTick<TValue> = {
  tickLabel: React.ReactNode;
  thumbLabel: React.ReactNode;
  value: TValue;
};

export type TimeSliderProps<TValue> = {
  ticks: TimeSliderTick<TValue>[];
  value: number; // Current slider position
  playing?: boolean;
  playbackSpeed?: number;
  hovering?: boolean;
  onScrub?: (index: number) => void; // user clicks/drag
};

export function TimeSlider<TValue>({
  ticks,
  value,
  playing = false,
  hovering = false,
  onScrub,
}: TimeSliderProps<TValue>) {
  const intervals = ticks.length - 1;

  // Thumb index (round to nearest tick)
  const index = Math.round(value);

  // Hover state for tooltip below track
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

    const percent = clampedX / rect.width;
    const hoverIndex = Math.round(percent * intervals);
    setHoverValue(Math.min(hoverIndex, intervals));
  };

  const handleMouseLeave = () => setHoverValue(null);

  return (
    <div className='relative flex w-full flex-col items-center'>
      <SliderPrimitive.Root
        min={0}
        max={intervals}
        step={0.01}
        value={[value]}
        onValueChange={([val]) => {
          onScrub?.(Math.round(val)); // always round to nearest tick
        }}
        className='relative flex w-full touch-none items-center select-none'
      >
        {/* Track */}
        <SliderPrimitive.Track
          className='bg-primary/25 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full'
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <SliderPrimitive.Range className='bg-primary/80 absolute h-full' />
        </SliderPrimitive.Track>

        {/* Hover tooltip below track */}
        {hoverValue !== null && ticks[hoverValue] && (
          <Badge
            className='text-secondary-foreground bg-secondary border-border pointer-events-none absolute top-4 z-[11] mt-1 w-fit rounded-none border-1 text-xs shadow-sm'
            style={{
              left: `calc(${(hoverValue / intervals) * 100}%)`,
              transform: 'translateX(-50%)',
            }}
          >
            {ticks[hoverValue].tickLabel}
          </Badge>
        )}

        {/* Thumb */}
        <SliderPrimitive.Thumb className='group border-secondary/80 focus-visible:ring-ring block h-5 w-5 cursor-pointer rounded-full border bg-[var(--time-slider-thumb)] shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
          <motion.div
            animate={{
              opacity: hovering || playing ? 1 : 0,
              scale: hovering || playing ? 1 : 0.95,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              mass: 0.8,
            }}
            className='absolute -top-5 left-1/2 z-[11] -translate-1/2 [transform:translateZ(0)]'
          >
            <Badge className='bg-primary border-border rounded-xl border-1 shadow-sm'>
              {ticks[index] && ticks[index].thumbLabel}
            </Badge>
            <MapTooltipTip className='border-t-primary mx-auto !-mt-1.5' />
          </motion.div>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}
