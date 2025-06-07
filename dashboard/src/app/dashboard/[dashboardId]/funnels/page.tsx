import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchFunnelsAction } from '@/app/actions';
import FunnelsListSection from './FunnelsListSection';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { OpenProvider } from '@/contexts/OpenContextProvider';

type FunnelsPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function FunnelsPage({ params }: FunnelsPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const funnelsPromise = fetchFunnelsAction(dashboardId);

  return (
    <div className='min-h-screen space-y-6 p-6'>
      <OpenProvider>
        <div className='flex flex-col justify-between gap-y-4 xl:flex-row xl:items-center'>
          <div>
            <h1 className='text-foreground mb-1 text-2xl font-bold'>Funnels</h1>
            <p className='text-muted-foreground text-sm'>Analyze user conversion paths</p>
          </div>
          <div className='flex flex-col-reverse gap-4 lg:flex-row lg:justify-end xl:items-center'>
            <CreateFunnelDialog />
            <DashboardFilters />
          </div>
        </div>

        <Suspense
          fallback={
            <div className='space-y-5'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='bg-card rounded-lg border p-6'>
                  <div className='mb-4 flex items-center gap-3'>
                    <Skeleton className='h-6 w-32' />
                    <Skeleton className='h-5 w-16' />
                  </div>
                  <div className='grid grid-cols-4 gap-2'>
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <FunnelsListSection funnelsPromise={funnelsPromise} dashboardId={dashboardId} />
        </Suspense>
      </OpenProvider>
    </div>
  );
}
