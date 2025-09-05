'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntegrationSheet } from './IntegrationSheet';
import { useTranslations } from 'next-intl';

export function IntegrationButton() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const t = useTranslations('components.integration');

  return (
    <>
      <Button onClick={() => setIsSheetOpen(true)} variant='secondary' className='border-border border-1'>
        {t('integrationSetup')}
      </Button>
      <IntegrationSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}
