import { Database, Shield, AlertTriangle, Users, ChevronLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Suspense, type ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { DashboardDropdown } from '@/components/sidebar/DashboardDropdown';
import { getAllUserDashboardsAction, getCurrentDashboardAction } from '@/app/actions/index.actions';

type SettingsSidebarProps = {
  dashboardId: string;
};

type SidebarItem = {
  name: string;
  key: string;
  href: string;
  icon: ReactElement;
};

export default async function SettingsSidebar({ dashboardId }: SettingsSidebarProps) {
  const currentDashboardPromise = getCurrentDashboardAction(dashboardId);

  const allDashboardsPromise = getAllUserDashboardsAction();

  const t = await getTranslations('dashboard.settings.sidebar');

  const settingsItems: SidebarItem[] = [
    {
      name: t('rules'),
      key: 'rules',
      href: `/dashboard/${dashboardId}/settings/rules`,
      icon: <Shield size={16} />,
    },
    {
      name: t('members'),
      key: 'members',
      href: `/dashboard/${dashboardId}/settings/members`,
      icon: <Users size={16} />,
    },
    {
      name: t('data'),
      key: 'data',
      href: `/dashboard/${dashboardId}/settings`,
      icon: <Database size={16} />,
    },
    {
      name: t('dangerZone'),
      key: 'danger-zone',
      href: `/dashboard/${dashboardId}/settings/danger-zone`,
      icon: <AlertTriangle size={16} />,
    },
  ];

  return (
    <Sidebar
      variant='sidebar'
      collapsible='icon'
      className='top-0 h-screen border-t md:top-14 md:h-[calc(100vh-3.5rem)]'
    >
      <SidebarHeader className='bg-sidebar rounded-t-xl'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <FilterPreservingLink
                href={`/dashboard/${dashboardId}`}
                className='text-muted-foreground hover:text-foreground flex items-center gap-2'
              >
                <ChevronLeft size={18} />
                <span>{t('backToDashboard')}</span>
              </FilterPreservingLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='bg-sidebar overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupContent className='overflow-hidden'>
            <Suspense fallback={<div className='bg-muted h-6 animate-pulse rounded' />}>
              <DashboardDropdown
                currentDashboardPromise={currentDashboardPromise}
                allDashboardsPromise={allDashboardsPromise}
              />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <FilterPreservingLink href={item.href} highlightOnPage>
                      <span className='dark:text-muted-foreground/90'>{item.icon}</span>
                      <span>{item.name}</span>
                    </FilterPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
