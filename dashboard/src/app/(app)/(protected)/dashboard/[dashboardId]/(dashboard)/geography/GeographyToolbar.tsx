import MapZoomButtons from '@/components/map/MapZoomButtons';
import MapCard from '@/components/map/MapCard';
import DashboardFilters from '@/components/dashboard/DashboardFilters';

// The page is fixed under the sidebar, so the toolbar starts where the sidebar ends
export default function GeographyToolbar() {
  return (
    <div className='pointer-events-none fixed top-16 right-0 left-(--sidebar-offset) z-30 flex items-start justify-between gap-4 px-2 transition-[left] duration-200 ease-linear sm:px-4'>
      <div className='pointer-events-auto hidden shrink-0 sm:block'>
        <MapZoomButtons />
      </div>
      <MapCard className='pointer-events-auto ml-auto w-full p-2 sm:w-auto'>
        <DashboardFilters />
      </MapCard>
    </div>
  );
}
