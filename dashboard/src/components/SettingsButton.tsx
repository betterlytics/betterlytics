'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from './ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';

const ICON_SIZE = 16;

export default function SettingsButton() {
  const t = useTranslations('components.settingsButton');
  const dashboardId = useDashboardId();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <FilterPreservingLink href={`/dashboard/${dashboardId}/settings`} highlightOnPage>
          <span className='dark:text-muted-foreground/90'>
            <Settings size={ICON_SIZE} />
          </span>
          <span>{t('dashboardSettings')}</span>
        </FilterPreservingLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
