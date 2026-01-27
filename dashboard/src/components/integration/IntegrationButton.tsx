'use client';

import { useState } from 'react';
import { IntegrationSheet } from './IntegrationSheet';
import { useTranslations } from 'next-intl';
import { Plug } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

const ICON_SIZE = 16;

export function IntegrationButton() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const t = useTranslations('components.integration');

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setIsSheetOpen(true)} className='cursor-pointer'>
          <span className='dark:text-muted-foreground/90'>
            <Plug size={ICON_SIZE} />
          </span>
          <span>{t('integrationSetup')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <IntegrationSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}
