'use client';

import { use, type ComponentProps } from 'react';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CreateDashboardDialog } from '@/app/(app)/(protected)/dashboards/CreateDashboardDialog';
import { getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import { useTranslations } from 'next-intl';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';
import { planThatUnlocks, type PlanDefinition } from '@/lib/billing/catalog';
import { isUnlimitedCount } from '@/lib/billing/capabilities';

export function CreateDashboardCard({
  dashboardStatsPromise,
}: {
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}) {
  const t = useTranslations('components.dashboards.createDialog');
  const dashboardStats = use(dashboardStatsPromise);
  const { openPlanPicker } = useBillingFlow();

  const limitReason = (plan: PlanDefinition | null) => {
    if (!plan) return t('limitReached');
    const sites = plan.capabilities.dashboards.maxDashboards;
    return isUnlimitedCount(sites)
      ? t('limitReachedUnlimitedPlan', { plan: plan.name })
      : t('limitReachedPlan', { plan: plan.name, count: sites });
  };

  if (dashboardStats.success && !dashboardStats.data.canCreateMore) {
    const { limit } = dashboardStats.data;
    const reason = limitReason(planThatUnlocks((c) => c.dashboards.maxDashboards > limit));
    return <CreateCard onClick={() => openPlanPicker(reason)} />;
  }

  return <CreateDashboardDialog dashboardStatsPromise={dashboardStatsPromise} trigger={<CreateCard />} />;
}

function CreateCard(props: ComponentProps<typeof Card>) {
  const t = useTranslations('dashboardsPage.createCard');

  return (
    <Card
      role='button'
      tabIndex={0}
      aria-label={t('title')}
      className='group border-border/70 hover:border-primary/30 focus-visible:border-primary/40 relative h-full cursor-pointer items-center justify-center border-2 border-dashed p-6 text-center transition-all outline-none hover:scale-[1.01] hover:shadow-lg focus-visible:scale-[1.01] focus-visible:shadow-lg'
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
      {...props}
    >
      <div className='flex h-full flex-col items-center justify-center gap-3'>
        <div className='bg-primary/10 group-hover:bg-primary/20 rounded-lg p-3 transition-colors'>
          <Plus className='text-primary h-6 w-6' />
        </div>
        <div className='space-y-1'>
          <div className='text-foreground font-medium'>{t('title')}</div>
          <div className='text-muted-foreground text-sm'>{t('description')}</div>
        </div>
      </div>
    </Card>
  );
}
