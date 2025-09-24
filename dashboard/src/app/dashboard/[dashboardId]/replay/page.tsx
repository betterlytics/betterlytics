import { env } from '@/lib/env';
import ReplayClient from '@/app/dashboard/[dashboardId]/replay/ReplayClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { dashboardId: string };
  searchParams?: { siteId?: string; sessionId?: string };
};

export default async function Page({ params, searchParams }: PageProps) {
  const dashboardId = await params.dashboardId;
  const siteId = (await searchParams?.siteId) ?? '';
  const sessionId = (await searchParams?.sessionId) ?? '';

  // Derive backend origin from the public tracking endpoint
  const trackingEndpoint = env.PUBLIC_TRACKING_SERVER_ENDPOINT;
  const backendOrigin = (() => {
    try {
      const u = new URL(trackingEndpoint);
      return `${u.protocol}//${u.host}`;
    } catch {
      return '';
    }
  })();

  return (
    <div className='space-y-4 p-6'>
      <h1 className='text-xl font-semibold'>Session Replay</h1>
      <ReplayClient
        dashboardId={dashboardId}
        initialSiteId={siteId}
        initialSessionId={sessionId}
        backendOrigin={backendOrigin}
      />
    </div>
  );
}
