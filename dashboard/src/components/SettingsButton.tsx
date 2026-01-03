'use client';

import SettingsPopover from './SettingsPopover';
import { Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useBARouter } from '@/hooks/use-ba-router';
import { useDashboardId } from '@/hooks/use-dashboard-id';

export default function SettingsButton() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const t = useTranslations('components.settingsButton');
  const router = useBARouter();
  const dashboardId = useDashboardId();

  const handleAdvancedSettingsClicked = () => {
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          className='text-foreground flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm font-medium'
        >
          <Settings size={18} />
          {t('dashboardSettings')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto border-none p-0 shadow-lg' side='top' align='start'>
        <SettingsPopover
          onAdvancedSettingsClicked={handleAdvancedSettingsClicked}
          onClose={() => setIsPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
