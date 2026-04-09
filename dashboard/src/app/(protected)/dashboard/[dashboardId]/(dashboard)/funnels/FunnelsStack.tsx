'use client';

import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelsEmptyState } from './FunnelsEmptyState';
import { FunnelActionButtons } from './FunnelActionButtons';
import { useBAQuery } from '@/trpc/hooks';
import { QuerySection } from '@/components/QuerySection';

export function FunnelsStack() {
  const query = useBAQuery((t, input, opts) => t.funnels.list.useQuery(input, opts));
  return (
    <QuerySection query={query} fallback={<FunnelsStackSkeleton />}>
      {(funnels) => {
        if (!funnels.length) return <FunnelsEmptyState />;
        return (
          <div className='space-y-10'>
            {funnels.map((funnel, i) => (
              <div key={funnel.id + i} className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
                <div className='flex w-full items-center justify-between'>
                  <h2 className='text-foreground px-1 text-xl font-semibold sm:px-2'>{funnel.name}</h2>
                  <FunnelActionButtons funnel={funnel} />
                </div>
                <FunnelBarplot funnel={funnel} />
              </div>
            ))}
          </div>
        );
      }}
    </QuerySection>
  );
}

export function FunnelsStackSkeleton() {
  return (
    <div className='space-y-10'>
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className='space-y-3'>
          <div className='bg-muted h-6 w-48 animate-pulse rounded' />
          <div className='bg-muted h-40 w-full animate-pulse rounded' />
        </section>
      ))}
    </div>
  );
}

export default FunnelsStack;
