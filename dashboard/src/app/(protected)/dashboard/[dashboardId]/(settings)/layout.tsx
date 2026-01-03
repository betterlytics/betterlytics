import { SidebarProvider } from '@/components/ui/sidebar';
import SettingsSidebar from './settings/SettingsSidebar';
import { SettingsFormProvider } from './settings/SettingsFormProvider';
import { SettingsContent } from './settings/SettingsContent';
import { getSiteConfigAction } from '@/app/actions/dashboard/siteConfig.action';

type SettingsSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function SettingsSidebarLayout({ params, children }: SettingsSidebarLayoutProps) {
  const { dashboardId } = await params;
  const siteConfig = await getSiteConfigAction(dashboardId);

  return (
    <SidebarProvider>
      <SettingsSidebar dashboardId={dashboardId} />
      <div className='flex w-full justify-center'>
        <SettingsFormProvider initialSiteConfig={siteConfig}>
          <SettingsContent>{children}</SettingsContent>
        </SettingsFormProvider>
      </div>
    </SidebarProvider>
  );
}
