'use client';

import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelsEmptyState } from './FunnelsEmptyState';
import { FunnelActionButtons } from './FunnelActionButtons';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';

export function FunnelsStack() {
  const { input, options } = useBAQueryParams();
  const query = trpc.funnels.list.useQuery(input, options);
  return (
    <QuerySection query={query} fallback={<FunnelsStackSkeleton />}>
      {(funnels) => {
        if (!funnels.length) return <FunnelsEmptyState />;
        return (
          <div className='space-y-10'>
            {funnels.map((funnel, i) => (
              <QuerySection.Item key={funnel.id + i}>
                <div className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
                  <div className='flex w-full items-center justify-between'>
                    <h2 className='text-foreground px-1 text-xl font-semibold sm:px-2'>{funnel.name}</h2>
                    <FunnelActionButtons funnel={funnel} />
                  </div>
                  <FunnelBarplot funnel={funnel} />
                </div>
              </QuerySection.Item>
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
