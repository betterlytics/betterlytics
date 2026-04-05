import { Suspense } from 'react';
import GeographySection from './GeographySection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import GeographyLoading from '@/components/loading/GeographyLoading';

export default function GeographyPage() {
  return (
    <div className='fixed inset-0 top-14 w-full'>
      <Suspense
        fallback={<GeographyLoading />}
      >
        <GeographySection />
      </Suspense>

      <div className='fixed top-16 right-4 z-30'>
        <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
          <DashboardFilters />
        </div>
      </div>
    </div>
  );
}
