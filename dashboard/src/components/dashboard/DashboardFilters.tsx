'use client';

import { TimeRangeToolbar } from '@/components/TimeRange/TimeRangeToolbar';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '@/components/filters/ActiveQueryFilters';
import { ReactNode, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrolledBehindTopbar } from '@/hooks/use-scrolled-behind-topbar';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { QueryFiltersEditorProvider } from '@/contexts/QueryFiltersEditorProvider';

interface DashboardFiltersProps {
  showComparison?: boolean;
  children?: ReactNode;
  showQueryFilters?: boolean;
}

export default function DashboardFilters({
  children,
  showComparison = true,
  showQueryFilters = true,
}: DashboardFiltersProps) {
  const isMobile = useIsMobile();
  const { queryFilters } = useQueryFiltersContext();
  const pillsRef = useRef<HTMLDivElement>(null);
  const hasPills = showQueryFilters && queryFilters.length > 0;
  const showBand = useScrolledBehindTopbar(pillsRef, hasPills);
  const [band, setBand] = useState<HTMLElement | null>(null);

  return (
    <QueryFiltersEditorProvider>
      <div data-slot='dashboard-filters' className='flex min-w-0 flex-col gap-2'>
        <div className='flex flex-col justify-end gap-x-8 gap-y-2 sm:flex-row'>
          {!isMobile && <div className='flex gap-4'>{children}</div>}
          {showQueryFilters && <QueryFiltersSelector anchor={band} />}
          <TimeRangeToolbar showComparison={showComparison} />
        </div>
        {showQueryFilters && (
          // Stays mounted while empty so new pills still flash, and inert while the band stands in
          <div ref={pillsRef} inert={showBand} className='empty:hidden'>
            <ActiveQueryFilters />
          </div>
        )}
        {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
        {hasPills && showBand && (
          <div className='pointer-events-none fixed top-(--topbar-height) right-(--removed-body-scroll-bar-size,0px) left-(--sidebar-offset) z-40 container mx-auto w-auto px-2 pt-2 transition-[left] duration-200 ease-linear sm:px-10'>
            <div ref={setBand} className='pointer-events-auto'>
              <ActiveQueryFilters variant='band' />
            </div>
          </div>
        )}
      </div>
    </QueryFiltersEditorProvider>
  );
}
