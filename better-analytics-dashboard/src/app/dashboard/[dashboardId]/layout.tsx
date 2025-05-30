import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BASidebar from "@/components/sidebar/BASidebar";
import { DashboardProvider } from "./DashboardProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import BAMobileSidebarTrigger from "@/components/sidebar/BAMobileSidebarTrigger";
import DictionaryProvider from '@/contexts/DictionaryContextProvider';
import { getDictionaryByDashboardId } from '@/app/actions/dictionary';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { dashboardId } = await params;
  const dictionary = await getDictionaryByDashboardId(dashboardId);

  return (
    <DashboardProvider>
      <DictionaryProvider dictionary={dictionary}>
        <SidebarProvider>
          <BASidebar dashboardId={dashboardId} />
          <BAMobileSidebarTrigger />
          <div className='bg-background flex min-h-screen w-full'>
            <main className='flex flex-1 flex-col'>
              <div className='flex-1'>{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </DictionaryProvider>
    </DashboardProvider>
  );
}
