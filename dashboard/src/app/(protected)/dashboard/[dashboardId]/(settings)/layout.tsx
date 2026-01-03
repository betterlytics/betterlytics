import { SidebarProvider } from '@/components/ui/sidebar';
import SettingsSidebar from './settings/SettingsSidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';

type SettingsSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function SettingsSidebarLayout({ params, children }: SettingsSidebarLayoutProps) {
  const { dashboardId } = await params;

  return (
    <SidebarProvider>
      <SettingsSidebar dashboardId={dashboardId} />
      <BAMobileSidebarTrigger />
      <div className='flex w-full justify-center md:mt-14'>
        <div className='w-full max-w-2xl p-6'>{children}</div>
      </div>
    </SidebarProvider>
  );
}
