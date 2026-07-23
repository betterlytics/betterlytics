import BATopbar from '@/components/topbar/BATopbar';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { type ReactNode } from 'react';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';

type DashboardsLayoutProps = {
  children: ReactNode;
};

export default async function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const publicEnvironmentVariables = getPublicEnvironmentVariables();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <section className='h-full w-full'>
        <BATopbar />
        {children}
      </section>
    </PublicEnvironmentVariablesProvider>
  );
}
