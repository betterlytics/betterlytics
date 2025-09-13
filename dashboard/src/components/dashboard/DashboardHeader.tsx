import { ReactNode } from 'react';

interface DashboardHeaderProps {
  title: string;
  children?: ReactNode;
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <div className='mb-4 flex flex-col justify-between gap-2 lg:flex-row'>
      <h1 className='pt-1 text-xl font-semibold sm:pl-1'>{title}</h1>
      {children}
    </div>
  );
}
