'use client';

import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelsEmptyState } from './FunnelsEmptyState';
import { FunnelActionButtons } from './FunnelActionButtons';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { FunnelsStackSkeleton } from '@/components/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function FunnelsStack() {
  const { input, options } = useBAQueryParams();
  const query = trpc.funnels.list.useQuery(input, options);
  const { data, loading, refetching } = useQueryState(query);

  if (loading) return <FunnelsStackSkeleton />;
  if (!data?.length) return <FunnelsEmptyState />;

  return (
    <div className='relative'>
      {refetching && (
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <Spinner />
        </div>
      )}
      <div className={cn(refetching && 'pointer-events-none opacity-60', 'space-y-10')}>
        {data.map((funnel, i) => (
          <div key={funnel.id + i} className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
            <div className='flex w-full items-center justify-between'>
              <h2 className='text-foreground px-1 text-xl font-semibold sm:px-2'>{funnel.name}</h2>
              <FunnelActionButtons funnel={funnel} />
            </div>
            <FunnelBarplot funnel={funnel} status='data' />
          </div>
        ))}
      </div>
    </div>
  );
}

export default FunnelsStack;
