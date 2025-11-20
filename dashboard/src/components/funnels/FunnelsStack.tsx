import { use } from 'react';
import type { fetchFunnelsAction } from '@/app/actions';
import FunnelBarplot from './FunnelBarplot';
import { FunnelsEmptyState } from '@/app/(protected)/dashboard/[dashboardId]/funnels/FunnelsEmptyState';

type FunnelsStackProps = {
  promise: ReturnType<typeof fetchFunnelsAction>;
};

export function FunnelsStack({ promise }: FunnelsStackProps) {
  const funnels = use(promise);
  if (!funnels.length) return <FunnelsEmptyState />;
  return (
    <div className='bg-card space-y-10 rounded-xl border p-4'>
      {funnels.map((f) => (
        <section key={f.id} aria-labelledby={`funnel-${f.id}-label`} className='space-y-3'>
          <h2 id={`funnel-${f.id}-label`} className='text-foreground text-base font-semibold'>
            {f.name}
          </h2>
          <FunnelBarplot funnel={f} />
        </section>
      ))}
    </div>
  );
}

FunnelsStack.Skeleton = function Skeleton() {
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
};

export default FunnelsStack;
