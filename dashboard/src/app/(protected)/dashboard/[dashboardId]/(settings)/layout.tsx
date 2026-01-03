import { SidebarProvider } from '@/components/ui/sidebar';
import SettingsSidebar from './settings/SettingsSidebar';

type SettingsSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function SettingsSidebarLayout({ params, children }: SettingsSidebarLayoutProps) {
  const { dashboardId } = await params;

  return (
    <SidebarProvider>
      <SettingsSidebar dashboardId={dashboardId} />
      <div className='flex w-full justify-center'>{children}</div>
    </SidebarProvider>
  );
}
