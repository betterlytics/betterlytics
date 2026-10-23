'use client';

import MapZoomButtons from '@/components/map/MapZoomButtons';
import DashboardFilters from '@/components/dashboard/DashboardFilters';

export default function GeographyToolbar() {
  return (
    <div className='pointer-events-none absolute top-2 right-2 left-2 z-30 flex items-start justify-between gap-4 sm:right-4 sm:left-4'>
      <div className='pointer-events-auto shrink-0'>
        <MapZoomButtons />
      </div>
      <div className='pointer-events-auto border-border flex gap-4 rounded-md border bg-card p-2 shadow-md dark:bg-(--card-interactive)'>
        <DashboardFilters />
      </div>
    </div>
  );
}
