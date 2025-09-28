import ReplayClient from '@/app/dashboard/[dashboardId]/replay/ReplayClient';

type PageProps = {
  params: Promise<{ dashboardId: string }>;
  searchParams?: Promise<{ siteId?: string; sessionId?: string }>;
};

export default async function Page({ params }: PageProps) {
  const { dashboardId } = await params;

  return (
    <div className='w-full space-y-4 p-4'>
      <h1 className='text-xl font-semibold'>Session Replay</h1>
      <ReplayClient dashboardId={dashboardId} />
    </div>
  );
}
