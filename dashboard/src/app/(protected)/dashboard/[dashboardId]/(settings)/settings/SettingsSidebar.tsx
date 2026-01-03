import { LayoutDashboard } from 'lucide-react';
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { Suspense } from 'react';
import type { ReactElement } from 'react';
import { getAllUserDashboardsAction, getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';

import { getTranslations } from 'next-intl/server';
import { Dashboard } from '@/entities/dashboard/dashboard.entities';
import { DashboardDropdown } from '@/components/sidebar/DashboardDropdown';

type BASidebarProps = {
  dashboardId: string;
};

type SidebarItem = {
  name: string;
  key: string;
  href: string;
  icon: ReactElement;
  hidden?: boolean;
  hideOnMobile?: boolean;
};

export default async function SettingsSidebar({ dashboardId }: BASidebarProps) {
  const currentDashboardPromise: Promise<Dashboard> = getCurrentDashboardAction(dashboardId);

  const allDashboardsPromise: Promise<ServerActionResponse<Dashboard[]>> = getAllUserDashboardsAction();

  const t = await getTranslations('dashboard.sidebar');

  const analyticsItems: SidebarItem[] = [
    { name: t('overview'), key: 'overview', href: '', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <Sidebar
      variant='sidebar'
      collapsible='icon'
      className='top-0 h-screen border-t md:top-14 md:h-[calc(100vh-3.5rem)]'
    >
      <SidebarHeader className='bg-sidebar rounded-t-xl pt-2'></SidebarHeader>
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

        <SidebarSeparator className='mx-0' />

        <SidebarGroup>
          <SidebarGroupLabel>{t('categories.analytics')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems
                .filter((item) => !item.hidden)
                .map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild>
                      <FilterPreservingLink href={item.href} highlightOnPage>
                        <span>{item.icon}</span>
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
