'use client';

import { use } from 'react';
import { getAllUserDashboardsAction, getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import DashboardCard from './DashboardCard';
import { CreateDashboardCard } from './CreateDashboardCard';

interface DashboardsGridProps {
  dashboardsPromise: ReturnType<typeof getAllUserDashboardsAction>;
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}

export function DashboardsGrid({ dashboardsPromise, dashboardStatsPromise }: DashboardsGridProps) {
  const dashboards = use(dashboardsPromise);

  if (!dashboards.success) {
    throw new Error('Failed to get dashboards');
  }

  if (dashboards.data.length === 0) {
    return null;
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {dashboards.data.map((dashboard) => (
        <DashboardCard key={dashboard.id} dashboard={dashboard} />
      ))}
      <CreateDashboardCard dashboardStatsPromise={dashboardStatsPromise} />
    </div>
  );
}
