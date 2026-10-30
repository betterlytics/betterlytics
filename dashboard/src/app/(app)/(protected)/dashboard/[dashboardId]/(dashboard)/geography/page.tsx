import GeographySection from './GeographySection';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCollectedGeoLevels } from '@/lib/geoLevels';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection subdivisionsEnabled={getCollectedGeoLevels().includes('subdivision_code')} />
    </div>
  );
}
