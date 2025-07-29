'use client';

import SettingsPopover from './SettingsPopover';
import { Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DashboardSettingsDialog from '@/components/dashboardSettings/DashboardSettingsDialog';
import { useSearchParamKey } from '@/hooks/use-search-param-key';

export default function SettingsButton() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useSearchParamKey('settings');

  const handleAdvancedSettingsClicked = () => {
    setIsDialogOpen(true);
    setIsPopoverOpen(false);
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            className='hover:bg-accent hover:text-accent-foreground text-foreground flex w-full items-center gap-2 rounded px-2 py-2 text-sm font-medium'
          >
            <Settings size={18} />
            Dashboard Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto border-none p-0 shadow-lg' side='top' align='start'>
          <SettingsPopover
            onAdvancedSettingsClicked={handleAdvancedSettingsClicked}
            onClose={() => setIsPopoverOpen(false)}
          />
        </PopoverContent>
      </Popover>
      <DashboardSettingsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
