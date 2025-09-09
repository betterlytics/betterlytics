'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Badge } from '@/components/ui/badge';

export type TimeSliderProps<TValue> = {
  ticks: { label: string; value: TValue }[]; // Array of ticks
  value: number; // Current slider position
  playing?: boolean;
  playbackSpeed?: number;
  onScrub?: (index: number) => void; // user clicks/drag
};

export function TimeSlider<TValue>({ ticks, value, playing = false, onScrub }: TimeSliderProps<TValue>) {
  const index = Math.floor(value);

  // Create an array of refs for each label
  const labelRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

  // This will store the label widths
  const [labelWidths, setLabelWidths] = React.useState<number[]>(new Array(ticks.length).fill(0));

  // Get the label widths after render
  React.useEffect(() => {
    const widths = labelRefs.current.map((ref) => ref?.getBoundingClientRect().width || 0);
    setLabelWidths(widths);
  }, [ticks]);

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
        <SliderPrimitive.Track className='bg-primary/25 relative h-1.5 w-full grow overflow-hidden rounded-full'>
          <SliderPrimitive.Range className='bg-primary/80 absolute h-full' />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb className='group border-secondary/80 bg-primary focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
          <Badge
            className={`bg-primary absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform ${playing ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}
          >
            {ticks[index]?.label}
          </Badge>
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>

      {/* Render the tick marks with labels */}
      <div className='absolute top-0 right-0 left-0 mx-1.5 mt-2 flex justify-between text-xs'>
        {ticks.map((tick, tickIndex) => {
          const positionPercent = (tickIndex / (ticks.length - 1)) * 100;
          const labelWidth = labelWidths[tickIndex];
          const offset = labelWidth > 0 ? labelWidth / ((ticks.length - 1) / 20) : 0; // Half of label width for centering

          return (
            <span
              key={tick.label}
              ref={(el) => {
                labelRefs.current[tickIndex] = el;
              }}
              style={{
                left: `calc(${positionPercent}% - ${offset - 4}px)`, // Fine-tune for last label
                transform: 'translateX(-50%)', // Ensure labels are centered properly over tick marks
              }}
              className='absolute'
            >
              {tick.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
