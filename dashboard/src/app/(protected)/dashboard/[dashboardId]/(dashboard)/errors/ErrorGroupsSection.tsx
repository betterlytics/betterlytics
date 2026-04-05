'use client';

import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { fetchErrorGroupsAction } from '@/app/actions/analytics/errors.actions';
import { useBAQuery } from '@/hooks/useBAQuery';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export function ErrorGroupsSection() {
  const dashboardId = useDashboardId();
  const query = useBAQuery({
    queryKey: ['error-groups'],
    queryFn: (dashboardId, q) => fetchErrorGroupsAction(dashboardId, q),
  });
  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {({ hasAnyErrors, errorGroups, initialVolumeMap }) => {
        if (!hasAnyErrors) return <ErrorsEmptyState />;
        return <ErrorTable errorGroups={errorGroups} initialVolumeMap={initialVolumeMap} dashboardId={dashboardId} />;
      }}
    </QuerySection>
  );
}
