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
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
import { ActiveUsersLabel } from './ActiveUsersLabel';
import { Suspense } from 'react';
import { getAllUserDashboardsAction, getCurrentDashboardAction } from '@/app/actions/dashboard';
import { DashboardDropdown } from './DashboardDropdown';

const navItems = [
  { name: 'Overview', href: '', icon: <LayoutDashboard size={18} /> },
  { name: 'Pages', href: 'pages', icon: <FileText size={18} /> },
  { name: 'Referrers', href: 'referrers', icon: <Link2 size={18} /> },
  { name: 'Geography', href: 'geography', icon: <Globe size={18} /> },
  { name: 'User Journey', href: 'user-journey', icon: <Route size={18} /> },
  { name: 'Funnels', href: 'funnels', icon: <Funnel size={18} /> },
  { name: 'Devices', href: 'devices', icon: <Smartphone size={18} /> },
  { name: 'Campaigns', href: 'campaign', icon: <DollarSign size={18} /> },
  { name: 'Events', href: 'events', icon: <CircleDot size={18} /> },
];

type BASidebarProps = {
  dashboardId: string;
};

export default async function BASidebar({ dashboardId }: BASidebarProps) {
  const currentDashboardPromise = getCurrentDashboardAction(dashboardId);
  const allDashboardsPromise = getAllUserDashboardsAction();

  return (
    <Sidebar variant='sidebar' collapsible='icon' className='top-14 h-[calc(100vh-3.5rem)] border-t'>
      <SidebarHeader className='bg-background rounded-t-xl pt-2'></SidebarHeader>
      <SidebarContent className='bg-background overflow-x-hidden pl-1'>
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

            <SidebarMenu className='mt-3'>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <FilterPreservingLink href={`/dashboard/${dashboardId}/${item.href}`}>
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
