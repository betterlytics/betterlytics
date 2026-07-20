import ReplayClient from './ReplayClient';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ dashboardId: string }>;
  searchParams?: Promise<{ siteId?: string; sessionId?: string }>;
};

export default async function Page({ params }: PageProps) {
  if (!isFeatureEnabled('enableSessionReplay')) {
    notFound();
  }

  const { dashboardId } = await params;

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='w-full space-y-4 p-4'>
      <DashboardHeader title={t('sessionReplay')}>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>
      <ReplayClient dashboardId={dashboardId} />
    </div>
  );
}
