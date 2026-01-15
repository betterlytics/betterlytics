import { redirect } from 'next/navigation';
import { DashboardProvider } from './DashboardProvider';
import { getCurrentDashboardAction } from '@/app/actions/index.actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { Suspense } from 'react';
import { fetchPublicEnvironmentVariablesAction, fetchSiteId } from '@/app/actions/index.actions';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { env } from '@/lib/env';
import { getCachedAuthorizedContext, requireAuth } from '@/auth/auth-actions';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthProvider';
import { InvitationJoinedToast } from '@/app/(protected)/InvitationJoinedToast';
import BATopbar from '@/components/topbar/BATopbar';
import { DashboardNavigationProvider } from '@/contexts/DashboardNavigationContext';
import ScrollReset from '@/components/ScrollReset';
import { TrackingScript } from './TrackingScript';
import { IntegrationManager } from './IntegrationManager';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const session = await requireAuth();

  const { dashboardId } = await params;

  const authCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);

  if (!authCtx) {
    if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
      redirect(`/share/${dashboardId}`);
    }
    redirect('/signin');
  }

  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  const shouldEnableTracking = isFeatureEnabled('enableDashboardTracking');
  let trackingSiteId: string | null = null;

  if (shouldEnableTracking) {
    try {
      trackingSiteId = await fetchSiteId(dashboardId);
    } catch (error) {
      console.error('Failed to fetch site ID for tracking:', error);
    }
  }

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardAuthProvider isDemo={false} role={authCtx.role}>
        <DashboardProvider>
          <DashboardNavigationProvider basePath='/dashboard' dashboardId={dashboardId} isDemo={false}>
            <InvitationJoinedToast />
            <section>
              <BATopbar />
              <main className='bg-background w-full overflow-x-hidden'>
                <ScrollReset />
                {children}
              </main>
              {trackingSiteId && <TrackingScript siteId={trackingSiteId} />}
              <Suspense>
                <IntegrationManager />
              </Suspense>
            </section>
          </DashboardNavigationProvider>
        </DashboardProvider>
      </DashboardAuthProvider>
    </PublicEnvironmentVariablesProvider>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;
  const dashboard = await getCurrentDashboardAction(dashboardId);

  return {
    title: `Betterlytics | ${dashboard.domain}`,
  };
}
