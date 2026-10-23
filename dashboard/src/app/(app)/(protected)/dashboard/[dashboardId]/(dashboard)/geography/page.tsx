import GeographySection from './GeographySection';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function GeographyPage() {
  return (
    <div className='relative isolate h-[calc(100dvh-var(--topbar-height)-1px)] w-full overflow-hidden'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection />
    </div>
  );
}
