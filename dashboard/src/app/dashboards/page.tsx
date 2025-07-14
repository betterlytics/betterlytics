import { getAllUserDashboardsAction, getUserDashboardStatsAction } from '@/app/actions/dashboard';
import { CreateDashboardDialog } from '@/app/dashboards/CreateDashboardDialog';
import DashboardCard from '@/app/dashboards/DashboardCard';
import ButtonSkeleton from '@/components/skeleton/ButtonSkeleton';
import { Suspense } from 'react';
import { VerificationSuccessHandler } from '@/components/accountVerification/VerificationSuccessHandler';

export default async function DashboardsPage() {
  const dashboards = await getAllUserDashboardsAction();
  const dashboardStatsPromise = getUserDashboardStatsAction();

  if (!dashboards.success) {
    throw new Error('Failed to get dashboards');
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      <VerificationSuccessHandler />

      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='mb-2 text-3xl font-bold tracking-tight'>Your Dashboards</h1>
          <p className='text-muted-foreground'>Manage and monitor analytics for all your websites.</p>
        </div>
        {dashboards.data.length > 0 && (
          <Suspense fallback={<ButtonSkeleton />}>
            <CreateDashboardDialog dashboardStatsPromise={dashboardStatsPromise} />
          </Suspense>
        )}
      </div>

      {dashboards.data.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {dashboards.data.map((dashboard) => (
            <DashboardCard key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      ) : (
        <div className='py-16 text-center'>
          <div className='mx-auto max-w-md'>
            <h3 className='text-foreground mb-2 text-lg font-semibold'>No dashboards yet</h3>
            <p className='text-muted-foreground mb-6 text-sm'>
              Create your first dashboard to start tracking analytics for your website.
            </p>
            <Suspense fallback={<ButtonSkeleton />}>
              <CreateDashboardDialog dashboardStatsPromise={dashboardStatsPromise} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
