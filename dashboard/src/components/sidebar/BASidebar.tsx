import {
  LayoutDashboard,
  FileText,
  Smartphone,
  CircleDot,
  Globe,
  Link2,
  Funnel,
  DollarSign,
  Route,
  ExternalLink as ExternalLinkIcon,
  BarChart,
  Gauge,
} from 'lucide-react';
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
import SettingsButton from '../SettingsButton';
import { IntegrationButton } from '@/components/integration/IntegrationButton';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { Suspense } from 'react';
import { getAllUserDashboardsAction, getCurrentDashboardAction } from '@/app/actions/dashboard';
import { DashboardDropdown } from './DashboardDropdown';

import { getTranslations } from 'next-intl/server';
import { ActiveUsersLabel } from './ActiveUsersLabel';

type BASidebarProps = {
  dashboardId: string;
};

export default async function BASidebar({ dashboardId }: BASidebarProps) {
  const currentDashboardPromise = getCurrentDashboardAction(dashboardId);
  const allDashboardsPromise = getAllUserDashboardsAction();
  const t = await getTranslations('dashboard.sidebar');

  const analyticsItems = [
    { name: t('overview'), href: '', icon: <LayoutDashboard size={18} /> },
    { name: t('pages'), href: '/pages', icon: <FileText size={18} /> },
    { name: t('referrers'), href: '/referrers', icon: <Link2 size={18} /> },
    { name: t('outboundLinks'), href: '/outbound-links', icon: <ExternalLinkIcon size={18} /> },
    { name: t('geography'), href: '/geography', icon: <Globe size={18} /> },
    { name: t('devices'), href: '/devices', icon: <Smartphone size={18} /> },
    { name: t('campaigns'), href: '/campaign', icon: <DollarSign size={18} /> },
  ];

  const behaviorItems = [
    { name: t('userJourney'), href: '/user-journey', icon: <Route size={18} /> },
    { name: t('funnels'), href: '/funnels', icon: <Funnel size={18} /> },
    { name: t('events'), href: '/events', icon: <CircleDot size={18} /> },
    { name: t('webVitals'), href: '/web-vitals', icon: <Gauge size={18} /> },
  ];

  return (
    <Sidebar
      variant='sidebar'
      collapsible='icon'
      className='top-0 h-screen border-t md:top-14 md:h-[calc(100vh-3.5rem)]'
    >
      <SidebarHeader className='bg-sidebar rounded-t-xl pt-2'></SidebarHeader>
      <SidebarContent className='bg-sidebar overflow-x-hidden pl-1'>
        <SidebarGroup>
          <SidebarGroupContent className='space-y-2 overflow-hidden px-2'>
            <Suspense fallback={<div className='bg-muted h-6 animate-pulse rounded' />}>
              <DashboardDropdown
                currentDashboardPromise={currentDashboardPromise}
                allDashboardsPromise={allDashboardsPromise}
              />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={null}>
              <ActiveUsersLabel />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <FilterPreservingLink href={`/dashboard/${dashboardId}${item.href}`} highlightOnPage>
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </FilterPreservingLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Behavior</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {behaviorItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <FilterPreservingLink href={`/dashboard/${dashboardId}${item.href}`} highlightOnPage>
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
      <SidebarFooter>
        <SidebarMenu className='gap-2'>
          <IntegrationButton />
          <SettingsButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
