'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchActiveUsersAction } from '@/app/actions/analytics/visitors.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { LiveIndicator } from '@/components/live-indicator';
import { AnimatedCounter } from '@/components/animated-counter';
import { useTranslations } from 'next-intl';

const ACTIVE_USERS_REFRESH_INTERVAL_MS = 30 * 1000;

export function ActiveUsersLabel() {
  const dashboardId = useDashboardId();
  const t = useTranslations('dashboard.sidebar');

  const { data: activeUsers = 0 } = useQuery({
    queryKey: ['activeUsers', dashboardId],
    queryFn: () => fetchActiveUsersAction(dashboardId),
    refetchInterval: ACTIVE_USERS_REFRESH_INTERVAL_MS,
  });

  return (
    <div className='text-muted-foreground flex h-8 items-center gap-2 px-2 text-xs font-medium group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1'>
      <LiveIndicator positionClassName='relative' sizeClassName='h-2.5 w-2.5' />
      <span className='text-muted-foreground text-sm font-semibold group-data-[collapsible=icon]:hidden'>
        <AnimatedCounter value={activeUsers} /> {t('activeUsers', { count: activeUsers })}
      </span>
      <span className='text-muted-foreground hidden pt-1.5 text-xs leading-none font-semibold group-data-[collapsible=icon]:block'>
        <AnimatedCounter value={activeUsers} />
      </span>
    </div>
  );
}
