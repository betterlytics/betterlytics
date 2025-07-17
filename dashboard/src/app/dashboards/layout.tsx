import BATopbar from '@/components/topbar/BATopbar';
import DictionaryProvider from '@/contexts/DictionaryContextProvider';
import { getDictionary } from '@/app/actions/dictionary';
import { type ReactNode } from 'react';

type DashboardsLayoutProps = {
  children: ReactNode;
};

export default async function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const { dictionary, language } = await getDictionary();

  return (
    <DictionaryProvider dictionary={dictionary} initialLanguage={language}>
      <section className='h-screen w-full'>
        <BATopbar />
        <main className='pt-20'>{children}</main>
      </section>
    </DictionaryProvider>
  );
}
