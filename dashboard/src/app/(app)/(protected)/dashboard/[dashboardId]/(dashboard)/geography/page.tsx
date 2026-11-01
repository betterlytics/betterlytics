import GeographySection from './GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      {!isFeatureEnabled('enableGeolocation') && <FeatureNotEnabledBanner feature='geography' />}
      <GeographySection />

      <div className='pointer-events-none fixed top-16 right-0 left-(--sidebar-offset) z-30 flex justify-end px-2 transition-[left] duration-200 ease-linear sm:px-4'>
        <div
          className={cn(
            'border-border bg-card pointer-events-auto min-w-0 rounded-md border p-2 shadow-md dark:bg-(--card-interactive)',
            // The filter band runs to the card's edges as its footer
            '[&_[data-slot=active-filters-band]]:-mx-2 [&_[data-slot=active-filters-band]]:-mb-2',
            '[&_[data-slot=active-filters-band]]:rounded-t-none [&_[data-slot=active-filters-band]]:rounded-b-[calc(var(--radius-md)-1px)]',
          )}
        >
          <DashboardFilters />
        </div>
      </div>
    </div>
  );
}
