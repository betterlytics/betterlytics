import BATopbar from '@/components/topbar/BATopbar';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions/system/environment.action';
import { type ReactNode } from 'react';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';

type DashboardsLayoutProps = {
  children: ReactNode;
};

export default async function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <section className='h-full w-full'>
        <BATopbar />
        {children}
      </section>
    </PublicEnvironmentVariablesProvider>
  );
}
