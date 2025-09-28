import ReplayClient from '@/app/dashboard/[dashboardId]/replay/ReplayClient';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type PageProps = {
  params: Promise<{ dashboardId: string }>;
  searchParams?: Promise<{ siteId?: string; sessionId?: string }>;
};

export default async function Page({ params }: PageProps) {
  const { dashboardId } = await params;

  return (
    <div className='w-full space-y-4 p-4'>
      <DashboardHeader title='Session Replay'>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>
      <ReplayClient dashboardId={dashboardId} />
    </div>
  );
}
