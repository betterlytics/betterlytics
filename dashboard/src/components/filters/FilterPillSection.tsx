import { type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function FilterPillSection({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type='button'
      aria-haspopup='dialog'
      className={cn(
        'inline-flex h-8 cursor-pointer items-center px-1.5 outline-none',
        'hover:bg-(--pill-bg) hover:[--pill-bg:var(--pill-bg-hover)]',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset',
        className,
      )}
      {...props}
    />
  );
}
