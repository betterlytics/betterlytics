'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export type TimeSliderTick<TValue> = {
  label: React.ReactNode;
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
            className='bg-primary/90 text-primary-foreground pointer-events-none absolute top-3 mt-1 w-fit rounded-none text-xs shadow'
            style={{
              left: `calc(${(hoverValue / intervals) * 100}%)`,
              transform: 'translateX(-50%)',
            }}
          >
            {ticks[hoverValue].label}
          </Badge>
        )}

        {/* Thumb */}
        <SliderPrimitive.Thumb className='group border-secondary/80 bg-primary focus-visible:ring-ring block h-5 w-5 cursor-pointer rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
          <AnimatePresence>
            {(hovering || playing) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              >
                <Badge
                  className={`bg-primary absolute -top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl transition-transform`}
                >
                  {ticks[index] && ticks[index].label}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}
