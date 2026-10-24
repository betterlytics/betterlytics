import type { ReactElement } from 'react';
import Link from 'next/link';
import { Bug, ChevronLeft, ScrollText, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ADMIN_SECTIONS, type AdminEdition, type AdminSectionKey } from '@/entities/admin/adminAccess.entities';
import { env } from '@/lib/env';
import { AdminNavLink } from './AdminNavLink';

const SECTION_ICONS: Record<AdminSectionKey, ReactElement> = {
  users: <Users size={16} />,
  'audit-log': <ScrollText size={16} />,
  'bug-reports': <Bug size={16} />,
};

type AdminSidebarProps = {
  edition: AdminEdition;
  sections: AdminSectionKey[];
};

export function AdminSidebar({ edition, sections }: AdminSidebarProps) {
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
              <Link
                href='/dashboards'
                className='text-muted-foreground hover:text-foreground flex items-center gap-2'
              >
                <ChevronLeft size={18} />
                <span>Back to dashboards</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='bg-sidebar overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{edition === 'cloud' ? 'Cloud admin' : 'Instance admin'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((key) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton asChild>
                    <AdminNavLink href={ADMIN_SECTIONS[key].href}>
                      <span className='dark:text-muted-foreground/90'>{SECTION_ICONS[key]}</span>
                      <span>{ADMIN_SECTIONS[key].label}</span>
                    </AdminNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='bg-sidebar'>
        {edition === 'selfhost' && (
          <span className='text-muted-foreground/70 px-2 font-mono text-xs group-data-[collapsible=icon]:hidden'>
            {env.APP_VERSION}
          </span>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
