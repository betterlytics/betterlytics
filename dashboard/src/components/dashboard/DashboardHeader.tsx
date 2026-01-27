import { ReactNode } from 'react';

interface DashboardHeaderProps {
  title: string;
  children?: ReactNode;
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <div className='mb-4 flex flex-col justify-between gap-2 lg:flex-row lg:items-start'>
      <h1 className='shrink-0 pt-1 text-xl font-semibold sm:pl-1'>{title}</h1>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}
