'use client';

import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export function ErrorGroupsSection() {
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const query = trpc.errors.errorGroups.useQuery(input, options);
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
