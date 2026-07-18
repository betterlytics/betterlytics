import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ol className={cn('relative grid grid-cols-[18px_minmax(0,1fr)] gap-x-3', className)}>{children}</ol>
  );
}

type TimelineItemProps = {
  isLast: boolean;
  headHeightPx: number;
  spacingPx: number;
  dot: ReactNode;
  lineClassName: string;
  children: ReactNode;
  className?: string;
};

export function TimelineItem({
  isLast,
  headHeightPx,
  spacingPx,
  dot,
  lineClassName,
  children,
  className,
}: TimelineItemProps) {
  return (
    <li
      className={cn('col-span-2 grid [grid-template-columns:subgrid]', className)}
      style={{ paddingBottom: isLast ? undefined : spacingPx }}
    >
      <div className='relative flex justify-center'>
        {!isLast ? (
          <span
            className={cn('absolute left-1/2 w-0.5 -translate-x-1/2', lineClassName)}
            style={{ top: headHeightPx / 2, bottom: -(spacingPx + headHeightPx / 2) }}
          />
        ) : null}
        <span className='relative z-10 flex items-center' style={{ height: headHeightPx }}>
          {dot}
        </span>
      </div>
      <div className='min-w-0'>{children}</div>
    </li>
  );
}
