import ReferrersSummarySection from './ReferrersSummarySection';
import ReferrersChartsSection from './ReferrersChartsSection';
import ReferrersTableSection from './ReferrersTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default async function ReferrersPage() {
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('referrers')}>
        <DashboardFilters />
      </DashboardHeader>
      <ReferrersSummarySection />
      <ReferrersChartsSection />
      <ReferrersTableSection />
    </div>
  );
}
