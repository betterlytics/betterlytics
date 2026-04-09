'use client';

import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { useBAQuery } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export function ErrorGroupsSection() {
  const dashboardId = useDashboardId();
  const query = useBAQuery((t, input, opts) => t.errors.errorGroups.useQuery(input, opts));
  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {({ hasAnyErrors, errorGroups, initialVolumeMap }) => {
        if (!hasAnyErrors) return <ErrorsEmptyState />;
        return (
          <ErrorTable errorGroups={errorGroups} initialVolumeMap={initialVolumeMap} dashboardId={dashboardId} />
        );
      }}
    </QuerySection>
  );
}
