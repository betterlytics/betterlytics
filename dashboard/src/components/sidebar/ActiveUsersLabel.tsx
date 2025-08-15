'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchActiveUsersAction } from '@/app/actions/visitors';
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
    <div className='text-muted-foreground flex items-center gap-4 pl-4.5 text-xs font-medium'>
      <div className='relative flex items-center justify-center pb-1'>
        <LiveIndicator />
      </div>
      <span className='text-muted-foreground text-sm font-semibold'>
        <AnimatedCounter value={activeUsers} /> {t('activeUsers', { count: activeUsers })}
      </span>
    </div>
  );
}
