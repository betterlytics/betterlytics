import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { ErrorGroupsSection } from './ErrorGroupsSection';
import { getTranslations } from 'next-intl/server';

export default async function ErrorsPage() {
  const t = await getTranslations('errors.page');

  return (
    <QueryFilterColumnsVisibilityProvider show={{ outbound_link_url: false, custom_event_name: false }}>
      <div className='container space-y-4 p-2 pt-4 sm:p-6'>
        <DashboardHeader title={t('title')}>
          <DashboardFilters showComparison={false} />
        </DashboardHeader>

        <ErrorGroupsSection />
      </div>
    </QueryFilterColumnsVisibilityProvider>
  );
}
