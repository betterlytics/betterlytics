'use client';

import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useTranslations } from 'next-intl';

const ICON_SIZE = 16;

export function CollapseSidebarButton() {
  const { toggleSidebar, state } = useSidebar();
  const t = useTranslations('dashboard.sidebar');
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggleSidebar} className='cursor-pointer'>
        <span className='dark:text-muted-foreground/90'>
          {isCollapsed ? <PanelLeft size={ICON_SIZE} /> : <PanelLeftClose size={ICON_SIZE} />}
        </span>
        <span>{t('collapseNav')}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
