import BATopbar from '@/components/topbar/BATopbar';
import DictionaryProvider from '@/contexts/DictionaryContextProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getDictionary } from '@/app/actions/dictionary';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions/environment';
import { type ReactNode } from 'react';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';

type DashboardsLayoutProps = {
  children: ReactNode;
};

export default async function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const { dictionary, language } = await getDictionary();
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <DictionaryProvider dictionary={dictionary} initialLanguage={language}>
          <section className='h-full w-full'>
            <BATopbar />
            {children}
          </section>
        </DictionaryProvider>
      </NextIntlClientProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
