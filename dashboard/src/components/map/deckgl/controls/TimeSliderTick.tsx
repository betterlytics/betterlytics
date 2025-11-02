import React from 'react';

export type TimeSliderTickType = {
  tickLabel: React.ReactNode;
  thumbLabel: React.ReactNode;
  opacity: number;
};

function TimeSliderTickComponent({
  index,
  tick,
  intervals,
  hoverValue,
  thumbWidth,
}: {
  index: number;
  tick: TimeSliderTickType;
  intervals: number;
  hoverValue: number | null;
  thumbWidth: number;
}) {
  const isHovered = hoverValue === index && tick.opacity > 0;

  return (
    <div
      className='absolute top-0 h-4 w-0.5 origin-bottom'
      style={{
        left: `calc(${thumbWidth / 2}px + (100% - ${thumbWidth}px) * ${index / intervals})`,
        opacity: Math.min(tick.opacity > 0 ? tick.opacity + 0.2 + +isHovered : 0, 1),
        transform: 'translateX(-50%)',
        backgroundColor: isHovered ? 'var(--time-slider-tick-hovered)' : 'var(--time-slider-tick)',
      }}
    />
  );
}

const TimeSliderTick = React.memo(TimeSliderTickComponent);
TimeSliderTick.displayName = 'TimeSliderTick';
export default TimeSliderTick;
