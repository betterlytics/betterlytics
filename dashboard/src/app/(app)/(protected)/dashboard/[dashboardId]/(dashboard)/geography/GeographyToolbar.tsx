'use client';

import MapZoomButtons from '@/components/map/MapZoomButtons';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { useSidebar } from '@/components/ui/sidebar';
import type { CSSProperties } from 'react';

// The page is fixed under the sidebar (stacking fix from #336); from md up the toolbar starts where the sidebar ends
export default function GeographyToolbar() {
  const { state } = useSidebar();
  const sidebarWidth = state === 'collapsed' ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';

  return (
    <div
      className='pointer-events-none fixed top-16 right-2 left-2 z-30 flex items-start justify-between gap-4 transition-[left] duration-200 ease-linear sm:right-4 sm:left-4 md:left-[calc(var(--toolbar-sidebar-width)+1rem)]'
      style={{ '--toolbar-sidebar-width': sidebarWidth } as CSSProperties}
    >
      <div className='pointer-events-auto shrink-0'>
        <MapZoomButtons />
      </div>
      <div className='bg-card pointer-events-auto flex gap-4 rounded-md p-2 shadow-md'>
        <DashboardFilters />
      </div>
    </div>
  );
}
