import PagesSummarySection from './PagesSummarySection';
import PagesTableSection from './PagesTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';

export default async function PagesPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <QueryFilterColumnsVisibilityProvider show={{ outbound_link_url: false, custom_event_name: false }}>
      <div className='container space-y-4 p-2 pt-4 sm:p-6'>
        <DashboardHeader title={t('pages')}>
          <DashboardFilters />
        </DashboardHeader>

        <PagesSummarySection />

        <PagesTableSection />
      </div>
    </QueryFilterColumnsVisibilityProvider>
  );
}
