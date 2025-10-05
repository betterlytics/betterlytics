'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Badge } from '@/components/ui/badge';

export type TimeSliderTick<TValue> = {
  label: React.ReactNode;
  value: TValue;
};

export type TimeSliderProps<TValue> = {
  ticks: TimeSliderTick<TValue>[];
  value: number; // Current slider position
  playing?: boolean;
  playbackSpeed?: number;
  onScrub?: (index: number) => void; // user clicks/drag
};

export function TimeSlider<TValue>({ ticks, value, playing = false, onScrub }: TimeSliderProps<TValue>) {
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
          className='bg-primary/25 relative h-1.5 w-full grow overflow-hidden rounded-full'
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
        <SliderPrimitive.Thumb className='group border-secondary/80 bg-primary focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
          <Badge
            className={`bg-primary absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl transition-transform ${
              playing ? 'scale-100' : 'scale-0 group-hover:scale-100'
            }`}
          >
            {ticks[index] && ticks[index].label}
          </Badge>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}
