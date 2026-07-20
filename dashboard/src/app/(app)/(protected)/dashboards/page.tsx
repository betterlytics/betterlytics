import { getAllUserDashboardsAction, getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import { getUserBillingData } from '@/actions/billing.action';
import { PendingInvitationsWrapper } from './PendingInvitationsWrapper';
import { DashboardsGrid } from './DashboardsGrid';
import { EmptyDashboardsState } from './EmptyDashboardsState';
import { DashboardsGridSkeleton } from '@/components/skeleton/DashboardsSkeletons';
import PlanQuota from './PlanQuota';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/auth/auth-actions';
import { featureFlagGuard } from '@/lib/feature-flags';
import { getUserPendingInvitationsAction } from '@/app/actions/dashboard/invitations.action';

export default async function DashboardsPage() {
  await requireAuth();

  const dashboardsPromise = getAllUserDashboardsAction();
  const invitationsPromise = getUserPendingInvitationsAction();
  const dashboardStatsPromise = getUserDashboardStatsAction();
  const billingDataPromiseGuard = featureFlagGuard('enableBilling', () => getUserBillingData());
  const t = await getTranslations('dashboardsPage');

  return (
    <>
      <Suspense fallback={null}>
        <PendingInvitationsWrapper invitationsPromise={invitationsPromise} />
      </Suspense>
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <div className='bg-card mb-8 rounded-xl border p-6'>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <h1 className='mb-2 text-3xl font-bold tracking-tight'>{t('title')}</h1>
              <p className='text-muted-foreground'>{t('subtitle')}</p>
            </div>

            <hr className='border-border w-full border-t sm:hidden' />
            {billingDataPromiseGuard.enabled && (
              <div className='flex w-full items-center gap-4 sm:w-auto'>
                <Suspense fallback={<div className='bg-muted h-8 w-full animate-pulse rounded sm:w-48' />}>
                  <PlanQuota billingDataPromise={billingDataPromiseGuard.value} />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        <Suspense fallback={<DashboardsGridSkeleton />}>
          <DashboardsGrid dashboardsPromise={dashboardsPromise} dashboardStatsPromise={dashboardStatsPromise} />
          <EmptyDashboardsState
            dashboardsPromise={dashboardsPromise}
            dashboardStatsPromise={dashboardStatsPromise}
          />
        </Suspense>
      </div>
    </>
  );
}

export async function generateMetadata() {
  const t = await getTranslations('dashboardsPage');
  return {
    title: `Betterlytics | ${t('title')}`,
  };
}
