import GeographySection from './GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection />

      <div className='pointer-events-none fixed top-16 right-0 left-(--sidebar-offset) z-30 flex justify-end px-2 transition-[left] duration-200 ease-linear sm:px-4'>
        <div className='border-border bg-card pointer-events-auto rounded-md border p-2 shadow-md dark:bg-(--card-interactive)'>
          <DashboardFilters />
        </div>
      </div>
    </div>
  );
}
