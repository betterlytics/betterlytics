import { ReactNode } from 'react';

type SettingsContentProps = {
  children: ReactNode;
};

export function SettingsContent({ children }: SettingsContentProps) {
  return <div className='w-full max-w-2xl p-6'>{children}</div>;
}
