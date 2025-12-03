import CampaignList from './CampaignList';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function CampaignPage({ params }: CampaignPageParams) {
  const { dashboardId } = await params;
  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('campaigns')}>
        <DashboardFilters showQueryFilters={false} showComparison={false} />
      </DashboardHeader>

      <CampaignList dashboardId={dashboardId} />
    </div>
  );
}
