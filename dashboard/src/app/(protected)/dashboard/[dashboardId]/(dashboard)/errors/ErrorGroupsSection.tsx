'use client';

import { ErrorTable } from './ErrorList';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQueryState } from '@/hooks/use-query-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function ErrorGroupsSection() {
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const query = trpc.errors.errorGroups.useQuery(input, options);
  const { data, loading, refetching } = useQueryState(query);

  if (!loading && data && !data.hasAnyErrors) {
    return <ErrorsEmptyState />;
  }

  return (
    <div className='relative'>
      {refetching && (
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <Spinner />
        </div>
      )}
      <div className={cn(refetching && 'pointer-events-none opacity-60')}>
        <ErrorTable
          errorGroups={data?.errorGroups ?? []}
          initialVolumeMap={data?.initialVolumeMap ?? {}}
          dashboardId={dashboardId}
          loading={loading}
        />
      </div>
    </div>
  );
}
