import BASidebarProvider from '@/components/sidebar/BASidebarProvider';
import SettingsSidebar from './settings/SettingsSidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import { requireAuth, resolveDashboardContext } from '@/auth/auth-actions';

type SettingsSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function SettingsSidebarLayout({ params, children }: SettingsSidebarLayoutProps) {
  const { dashboardId } = await params;
  // The sidebar starts dashboard requests before awaiting translations, so access is settled first to keep a
  // redirect out of an unhandled promise. requireAuth covers signed-out visitors on the demo dashboard.
  await requireAuth();
  await resolveDashboardContext(dashboardId);

  return (
    <BASidebarProvider>
      <SettingsSidebar dashboardId={dashboardId} />
      <BAMobileSidebarTrigger />
      <div className='flex w-full justify-center md:mt-14'>
        <div className='w-full max-w-2xl p-6'>{children}</div>
      </div>
    </BASidebarProvider>
  );
}
