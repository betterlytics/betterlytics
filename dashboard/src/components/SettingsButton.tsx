'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardSettingsDialog from '@/components/dashboardSettings/DashboardSettingsDialog';
import { useSearchParamKey } from '@/hooks/use-search-param-key';

export default function SettingsButton() {
  const [showSettingsDialog, setShowSettingsDialog] = useSearchParamKey('settings');

  return (
    <>
      <Button
        variant='ghost'
        onClick={() => setShowSettingsDialog(true)}
        className='hover:bg-accent hover:text-accent-foreground text-foreground flex w-full items-center gap-2 rounded px-2 py-2 text-sm font-medium'
      >
        <Settings size={18} />
        Dashboard Settings
      </Button>
      <DashboardSettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </>
  );
}
