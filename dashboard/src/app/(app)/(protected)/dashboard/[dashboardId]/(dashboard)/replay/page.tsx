import ReplayClient from './ReplayClient';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { FeatureNotEnabledBanner } from '@/components/dashboard/FeatureNotEnabledBanner';

type PageProps = {
  params: Promise<{ dashboardId: string }>;
  searchParams?: Promise<{ siteId?: string; sessionId?: string }>;
};

export default async function Page({ params }: PageProps) {
  const { dashboardId } = await params;

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='w-full space-y-4 p-4'>
      {!isFeatureEnabled('enableSessionReplay') && <FeatureNotEnabledBanner feature='sessionReplay' />}
      <DashboardHeader title={t('sessionReplay')}>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>
      <ReplayClient dashboardId={dashboardId} />
    </div>
  );
}
