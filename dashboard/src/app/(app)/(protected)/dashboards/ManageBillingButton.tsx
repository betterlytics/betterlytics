'use client';

import { useState } from 'react';
import UserSettingsDialog from '@/components/userSettings/UserSettingsDialog';

export function ManageBillingButton({ label }: { label: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setIsDialogOpen(true)}
        className='text-primary hover:text-primary/90 inline-flex cursor-pointer items-center rounded-md px-1.5 py-0.5 text-xs font-medium'
      >
        {label}
      </button>
      <UserSettingsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} initialTab='billing' />
    </>
  );
}
