import { getAllUserDashboardsAction, getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import { getUserBillingData } from '@/actions/billing.action';
import { CreateDashboardDialog } from '@/app/(protected)/dashboards/CreateDashboardDialog';
import DashboardCard from '@/app/(protected)/dashboards/DashboardCard';
import { CreateDashboardCard } from '@/app/(protected)/dashboards/CreateDashboardCard';
import PlanQuota from './PlanQuota';
import ButtonSkeleton from '@/components/skeleton/ButtonSkeleton';
import { Suspense } from 'react';
import { VerificationSuccessHandler } from '@/components/accountVerification/VerificationSuccessHandler';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/signin');
  }
  const dashboards = await getAllUserDashboardsAction();
  const dashboardStatsPromise = getUserDashboardStatsAction();
  const billingDataPromise = getUserBillingData();
  const t = await getTranslations('dashboardsPage');

  if (!dashboards.success) {
    throw new Error('Failed to get dashboards');
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      <VerificationSuccessHandler />

      <div className='bg-card mb-8 rounded-xl border p-6'>
        <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
          <div>
            <h1 className='mb-2 text-3xl font-bold tracking-tight'>{t('title')}</h1>
            <p className='text-muted-foreground'>{t('subtitle')}</p>
          </div>

          <hr className='border-border w-full border-t sm:hidden' />

          <div className='flex w-full items-center gap-4 sm:w-auto'>
            <Suspense fallback={<div className='bg-muted h-8 w-full animate-pulse rounded sm:w-48' />}>
              <PlanQuota billingDataPromise={billingDataPromise} />
            </Suspense>
          </div>
        </div>
      </div>

      {dashboards.data.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {dashboards.data.map((dashboard) => (
            <DashboardCard key={dashboard.id} dashboard={dashboard} />
          ))}
          <CreateDashboardCard dashboardStatsPromise={dashboardStatsPromise} />
        </div>
      ) : (
        <div className='py-16 text-center'>
          <div className='mx-auto max-w-md'>
            <h3 className='text-foreground mb-2 text-lg font-semibold'>{t('emptyTitle')}</h3>
            <p className='text-muted-foreground mb-6 text-sm'>{t('emptyDescription')}</p>
            <Suspense fallback={<ButtonSkeleton />}>
              <div className='[&_button]:bg-primary [&_button]:text-primary-foreground [&_button:hover]:bg-primary/90 [&_button]:cursor-pointer'>
                <CreateDashboardDialog dashboardStatsPromise={dashboardStatsPromise} />
              </div>
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata() {
  const t = await getTranslations('dashboardsPage');
  return {
    title: `Betterlytics | ${t('title')}`,
  };
}
