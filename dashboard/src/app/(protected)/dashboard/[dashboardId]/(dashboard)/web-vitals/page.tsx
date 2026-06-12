import DashboardFilters from '@/components/dashboard/DashboardFilters';
import InteractiveWebVitalsChartSection from './InteractiveWebVitalsChartSection';
import WebVitalsTableSection from './webVitalsTableSection';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QueryFilterColumnsVisibilityProvider } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { WebVitalsBanner } from './WebVitalsBanner';

export default async function WebVitalsPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <QueryFilterColumnsVisibilityProvider hide={['outbound_link_url', 'custom_event_name']}>
      <div className='container space-y-4 p-2 pt-4 sm:p-6'>
        <DashboardHeader title={t('webVitals')}>
          <DashboardFilters showComparison={false} />
        </DashboardHeader>
        <WebVitalsBanner />
        <InteractiveWebVitalsChartSection />
        <WebVitalsTableSection />
      </div>
    </QueryFilterColumnsVisibilityProvider>
  );
}
