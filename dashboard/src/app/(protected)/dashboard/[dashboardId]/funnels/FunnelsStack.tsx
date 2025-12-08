import { use } from 'react';
import type { fetchFunnelsAction } from '@/app/actions/index.actions';
import { FunnelsEmptyState } from '@/app/(protected)/dashboard/[dashboardId]/funnels/FunnelsEmptyState';
import { FunnelsStackClient } from './FunnelsStackClient';

type FunnelsStackProps = {
  promise: ReturnType<typeof fetchFunnelsAction>;
};

export function FunnelsStack({ promise }: FunnelsStackProps) {
  const funnels = use(promise);
  if (!funnels.length) return <FunnelsEmptyState />;
  return <FunnelsStackClient funnels={funnels} />;
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
