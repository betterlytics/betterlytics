import { getUserDashboardStatsAction } from '@/app/actions/dashboard';
import { getUserBillingData } from '@/actions/billing';

type DashboardStatsResult = Awaited<ReturnType<typeof getUserDashboardStatsAction>>;

export default async function PlanQuota({
  dashboardStatsPromise,
}: {
  dashboardStatsPromise: Promise<DashboardStatsResult>;
}) {
  const [stats, billing] = await Promise.all([dashboardStatsPromise, getUserBillingData()]);
  if (!stats?.success) return null;

  const { current, limit } = stats.data;
  const percentage = Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
  const tier = billing?.success ? billing.data.subscription.tier : undefined;
  const planLabel =
    tier === 'professional'
      ? 'Pro Plan'
      : tier === 'growth'
        ? 'Growth Plan'
        : tier === 'enterprise'
          ? 'Enterprise'
          : 'Plan';

  return (
    <div className='flex w-full min-w-0 flex-col gap-2 rounded-md py-1 text-sm sm:min-w-[280px]'>
      <div className='flex items-center justify-between'>
        <div className='font-medium'>Dashboards</div>
        <a
          href='/billing'
          className='text-primary hover:text-primary/90 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium'
        >
          Manage
        </a>
      </div>

      <div className='text-2xl font-semibold'>
        {current}
        <span className='text-muted-foreground text-base font-normal'> / {limit}</span>
      </div>

      <div className='flex items-center justify-between text-xs'>
        <span className='text-muted-foreground'>{planLabel}</span>
        <span>{percentage}%</span>
      </div>

      <div className='bg-muted h-1.5 w-full rounded'>
        <div
          className='bg-primary h-1.5 rounded'
          style={{ width: `${percentage}%` }}
          aria-label='Plan usage'
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={current}
        />
      </div>
    </div>
  );
}
