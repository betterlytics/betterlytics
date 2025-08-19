import BATopbar from '@/components/topbar/BATopbar';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions/environment';
import { type ReactNode } from 'react';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { NextIntlClientProvider } from 'next-intl';

type DashboardsLayoutProps = {
  children: ReactNode;
};

export default async function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <NextIntlClientProvider>
        <section className='h-full w-full'>
          <BATopbar />
          {children}
        </section>
      </NextIntlClientProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
