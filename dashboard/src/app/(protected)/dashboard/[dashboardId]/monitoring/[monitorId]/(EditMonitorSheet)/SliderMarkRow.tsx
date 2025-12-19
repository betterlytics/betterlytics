'use client';

type SliderMarkRowProps = {
  marks: { idx: number; label: string }[];
  totalSteps: number;
  activeIndex: number;
};

/**
 * Unified slider mark row component for displaying tick labels under a slider.
 */
export function SliderMarkRow({ marks, totalSteps, activeIndex }: SliderMarkRowProps) {
  return (
    <div className='relative h-5'>
      {marks.map(({ idx, label }, i) => {
        const position = (idx / totalSteps) * 100;
        const isFirst = i === 0;
        const isLast = i === marks.length - 1;

        return (
          <span
            key={idx}
            className={`text-muted-foreground absolute text-xs ${idx === activeIndex ? 'text-foreground font-semibold' : ''} ${isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: `${position}%` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
