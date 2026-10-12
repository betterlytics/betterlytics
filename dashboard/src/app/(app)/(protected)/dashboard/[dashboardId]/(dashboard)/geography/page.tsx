import GeographySection from './GeographySection';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection />
    </div>
  );
}
