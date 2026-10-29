'use client';

import { ReactNode, useRef } from 'react';
import { usePinnedHeader } from '@/hooks/use-pinned-header';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  children?: ReactNode;
  pinnable?: boolean;
}

export function DashboardHeader({ title, children, pinnable = true }: DashboardHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePinnedHeader(ref);

  return (
    <div
      ref={ref}
      className={cn(
        '-mt-2 mb-2 flex flex-col justify-between gap-2 py-2 lg:flex-row lg:flex-wrap',
        '[&>[data-slot=dashboard-filters]]:contents',
        pinnable && [
          'bg-background z-30 transition-shadow',
          'top-[calc(var(--topbar-height)_-_var(--pinned-header-band-offset))] has-data-[slot=active-filters-band]:sticky',
          'xl:top-(--topbar-height) xl:has-data-[slot=dashboard-filters]:sticky',
          'data-stuck:shadow-[0_10px_12px_-6px_var(--background)]',
          'max-xl:data-stuck:[clip-path:inset(var(--pinned-header-band-offset)_0_-1.5rem_0)]',
        ],
      )}
    >
      <h1 className='pt-1 text-xl font-semibold sm:pl-1'>{title}</h1>
      {children}
    </div>
  );
}
