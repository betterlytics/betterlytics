'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from './ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';

export default function SettingsButton() {
  const t = useTranslations('components.settingsButton');
  const dashboardId = useDashboardId();

  return (
    <FilterPreservingLink
      href={`/dashboard/${dashboardId}/settings`}
      className='text-foreground hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm font-medium'
    >
      <Settings size={18} />
      {t('dashboardSettings')}
    </FilterPreservingLink>
  );
}
