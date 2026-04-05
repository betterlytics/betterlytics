'use client';

import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { fetchErrorGroupsAction } from '@/app/actions/analytics/errors.actions';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';
import { useDashboardId } from '@/hooks/use-dashboard-id';

export function ErrorGroupsSection() {
  const dashboardId = useDashboardId();
  const { data: { hasAnyErrors, errorGroups, initialVolumeMap } } = useBASuspenseQuery({
    queryKey: ['error-groups'],
    queryFn: (dashboardId, query) => fetchErrorGroupsAction(dashboardId, query),
  });
  if (!hasAnyErrors) return <ErrorsEmptyState />;
  return <ErrorTable errorGroups={errorGroups} initialVolumeMap={initialVolumeMap} dashboardId={dashboardId} />;
}
