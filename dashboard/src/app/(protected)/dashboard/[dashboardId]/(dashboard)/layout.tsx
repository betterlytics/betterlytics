import { SidebarProvider } from '@/components/ui/sidebar';
import BASidebar from '@/components/sidebar/BASidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';

type DashboardSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardSidebarLayout({ params, children }: DashboardSidebarLayoutProps) {
  const { dashboardId } = await params;

  return (
    <SidebarProvider>
      <BASidebar dashboardId={dashboardId} isDemo={false} />
      <BAMobileSidebarTrigger />
      <div className='flex w-full justify-center'>{children}</div>
    </SidebarProvider>
  );
}
