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
    <div className='space-y-10'>
      {[funnels[0], funnels[0], funnels[0]].map((f, i) => (
        <div key={i}>
          <FunnelBarplot
            funnel={{
              visitorCount: {
                min: 2,
                max: 2,
              },
              steps: [
                {
                  queryFilter: {
                    id: 'mi67mthirq4bh1ztxr8',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*',
                  },
                  visitors: 28604,
                  visitorsRatio: 1,
                  dropoffCount: 11162,
                  dropoffRatio: 0.392,
                  stepFilters: [
                    {
                      id: 'mi67mthirq4bh1ztxr8',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*',
                    },
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                  ],
                },
                {
                  queryFilter: {
                    id: 'mi67mthkwd4z0jy94bd',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*/funnels',
                  },
                  visitors: 17162,
                  visitorsRatio: 0.66,
                  dropoffCount: 1955,
                  dropoffRatio: 0.118,
                  stepFilters: [
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                  ],
                },
                {
                  queryFilter: {
                    id: 'mi67mthkwd4z0jy94bd',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*/test',
                  },
                  visitors: 15307,
                  visitorsRatio: 0.561,
                  dropoffCount: 7634,
                  dropoffRatio: 0.435,
                  stepFilters: [
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                  ],
                },
                {
                  queryFilter: {
                    id: 'mi67mthkwd4z0jy94bd',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*/test',
                  },
                  visitors: 4543,
                  visitorsRatio: 0.163,
                  dropoffCount: 2268,
                  dropoffRatio: 0.341,
                  stepFilters: [
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                    {
                      id: 'mi67mthkwd4z0jy94bd',
                      column: 'url',
                      operator: '=',
                      value: '/dashboard/*/funnels',
                    },
                  ],
                },
              ],
              biggestDropOff: {
                queryFilter: {
                  id: 'mi67mthirq4bh1ztxr8',
                  column: 'url',
                  operator: '=',
                  value: '/dashboard/*',
                },
                visitors: 2,
                visitorsRatio: 1,
                dropoffCount: 0,
                dropoffRatio: 0,
                stepFilters: [
                  {
                    id: 'mi67mthirq4bh1ztxr8',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*',
                  },
                  {
                    id: 'mi67mthkwd4z0jy94bd',
                    column: 'url',
                    operator: '=',
                    value: '/dashboard/*/funnels',
                  },
                ],
              },
              conversionRate: 1,
              name: 'My new funnel',
            }}
          />
        </div>
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
