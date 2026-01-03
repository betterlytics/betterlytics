import { ArrowLeft, Database, Shield, AlertTriangle } from 'lucide-react';
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
import type { ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';

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
  const t = await getTranslations('dashboard.settings.sidebar');

  const settingsItems: SidebarItem[] = [
    {
      name: t('data'),
      key: 'data',
      href: `/dashboard/${dashboardId}/settings`,
      icon: <Database size={18} />,
    },
    {
      name: t('rules'),
      key: 'rules',
      href: `/dashboard/${dashboardId}/settings/rules`,
      icon: <Shield size={18} />,
    },
    {
      name: t('dangerZone'),
      key: 'danger-zone',
      href: `/dashboard/${dashboardId}/settings/danger-zone`,
      icon: <AlertTriangle size={18} />,
    },
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
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <FilterPreservingLink
                    href={`/dashboard/${dashboardId}`}
                    className='text-muted-foreground hover:text-foreground flex items-center gap-2'
                  >
                    <ArrowLeft size={18} />
                    <span>{t('backToDashboard')}</span>
                  </FilterPreservingLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className='mx-0' />

        <SidebarGroup>
          <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
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
