import CampaignList from './CampaignList';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PageContainer } from '@/components/layout';

type CampaignPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function CampaignPage({ params }: CampaignPageParams) {
  const { dashboardId } = await params;
  const t = await getTranslations('dashboard.sidebar');

  return (
    <PageContainer>
      <DashboardHeader title={t('campaigns')}>
        <DashboardFilters showQueryFilters={false} showComparison={false} />
      </DashboardHeader>

      <CampaignList dashboardId={dashboardId} />
    </PageContainer>
  );
}
