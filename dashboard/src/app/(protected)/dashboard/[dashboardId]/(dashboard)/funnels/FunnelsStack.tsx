'use client';

import { fetchFunnelsAction } from '@/app/actions/index.actions';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelsEmptyState } from './FunnelsEmptyState';
import { FunnelActionButtons } from './FunnelActionButtons';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export function FunnelsStack() {
  const { data: funnels } = useBASuspenseQuery({
    queryKey: ['funnels'],
    queryFn: (dashboardId, query) => fetchFunnelsAction(dashboardId, query.startDate, query.endDate),
  });
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
