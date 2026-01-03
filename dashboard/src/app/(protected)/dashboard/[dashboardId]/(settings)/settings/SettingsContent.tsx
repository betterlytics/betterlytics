'use client';

import { ReactNode } from 'react';
import { SettingsSaveButton } from './SettingsSaveButton';

type SettingsContentProps = {
  children: ReactNode;
};

export function SettingsContent({ children }: SettingsContentProps) {
  return (
    <div className='flex h-full w-full max-w-4xl flex-col'>
      <div className='flex-1 overflow-y-auto p-6'>{children}</div>
      <SettingsSaveButton />
    </div>
  );
}
