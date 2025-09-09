'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Badge } from '@/components/ui/badge';

export type TimeSliderProps<TValue> = {
  ticks: { label: string; value: TValue }[];
  value: number; // float playback position (e.g. 10.3), TODO: Rename to fractionalIdx or something
  playing?: boolean;
  playbackSpeed?: number;
  onScrub?: (index: number) => void; // user clicks/drag
};

export function TimeSlider<TValue>({ ticks, value, playing = false, onScrub }: TimeSliderProps<TValue>) {
  const index = Math.floor(value);

  return (
    <div className='relative flex w-full flex-col items-center'>
      <SliderPrimitive.Root
        min={0}
        max={ticks.length - 1}
        step={0.01} // allows smooth positions
        value={[value]}
        onValueChange={([val]) => {
          onScrub?.(Math.floor(val));
        }}
        className='relative flex w-full touch-none items-center select-none'
      >
        <SliderPrimitive.Track className='bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full'>
          <SliderPrimitive.Range className='bg-primary absolute h-full' />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb className='group border-primary/50 bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
          {/* Tooltip */}
          <Badge
            className={`absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform ${
              playing ? 'scale-100' : 'scale-0 group-hover:scale-100'
            }`}
          >
            {ticks[index]?.label}
          </Badge>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  );
}
