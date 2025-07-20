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
      <section className='h-full w-full'>
        <BATopbar />
        <div className='pt-[50px]'>{children}</div>
      </section>
    </DictionaryProvider>
  );
}
