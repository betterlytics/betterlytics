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
  usePinnedHeader(ref, pinnable);

  return (
    <div
      ref={ref}
      className={cn(
        '-mt-2 mb-2 flex flex-col justify-between gap-2 py-2 lg:flex-row lg:flex-wrap',
        '[&>[data-slot=dashboard-filters]]:contents',
        pinnable && [
          // Only the part above the band is opaque, so content stays visible and clickable around the tucked-in band.
          'pointer-events-none relative z-30 *:pointer-events-auto',
          'before:bg-background before:pointer-events-auto before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-full before:transition-shadow',
          'has-data-[slot=active-filters-band]:before:h-(--pinned-header-band-offset)',
          'top-[calc(var(--topbar-height)_-_var(--pinned-header-band-offset))] has-data-[slot=active-filters-band]:sticky',
          'xl:top-(--topbar-height) xl:has-data-[slot=dashboard-filters]:sticky',
          'xl:data-stuck:before:shadow-[0_10px_12px_-6px_var(--background)]',
          'max-xl:data-stuck:[clip-path:inset(var(--pinned-header-band-offset)_0_0)]',
          'max-xl:data-stuck:*:invisible max-xl:data-stuck:[&_[data-slot=active-filters-band]]:visible',
        ],
      )}
    >
      <h1 className='pt-1 text-xl font-semibold sm:pl-1'>{title}</h1>
      {children}
    </div>
  );
}
