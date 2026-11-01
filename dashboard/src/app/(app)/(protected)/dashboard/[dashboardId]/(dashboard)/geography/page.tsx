import GeographySection from './GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import MapCard from '@/components/map/MapCard';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getQueryableGeoLevels } from '@/lib/geoLevels';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection subdivisionsEnabled={getQueryableGeoLevels().includes('subdivision_code')} />

      <div className='pointer-events-none fixed top-16 right-0 left-(--sidebar-offset) z-30 flex justify-end px-2 transition-[left] duration-200 ease-linear sm:px-4'>
        <MapCard className='pointer-events-auto p-2'>
          <DashboardFilters />
        </MapCard>
      </div>
    </div>
  );
}
