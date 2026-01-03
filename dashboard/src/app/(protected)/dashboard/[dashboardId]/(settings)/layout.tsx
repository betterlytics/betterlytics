import { SidebarProvider } from '@/components/ui/sidebar';
import SettingsSidebar from './settings/SettingsSidebar';
import { SettingsContent } from './settings/SettingsContent';
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
        <SettingsContent>{children}</SettingsContent>
      </div>
    </SidebarProvider>
  );
}
