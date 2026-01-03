'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useSettingsForm } from './SettingsFormProvider';
import { useTranslations } from 'next-intl';

export function SettingsSaveButton() {
  const { hasChanges, save, isPending, isLoading } = useSettingsForm();
  const t = useTranslations('components.dashboardSettingsDialog');

  if (isLoading) {
    return null;
  }

  return (
    <div className='border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 flex justify-end border-t px-6 py-4 backdrop-blur'>
      <Button onClick={save} disabled={isPending || !hasChanges} className='cursor-pointer'>
        {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
        {t('saveChanges')}
      </Button>
    </div>
  );
}
