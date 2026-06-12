import EventsTableSection from './EventsTableSection';
import { EventLog } from './EventLog';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';

export default async function EventsPage() {
  const t = await getTranslations('dashboard.sidebar');

  return (
    <QueryFilterColumnsVisibilityProvider hide={['outbound_link_url']}>
      <div className='container space-y-3 p-2 pt-4 sm:p-6'>
        <DashboardHeader title={t('events')}>
          <DashboardFilters />
        </DashboardHeader>

        <EventsTableSection />

        <EventLog />
      </div>
    </QueryFilterColumnsVisibilityProvider>
  );
}
