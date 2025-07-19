import { Footer } from '@/components/footer/Footer';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import DictionaryProvider from '@/contexts/DictionaryContextProvider';
import { getEffectiveLanguage, SupportedLanguages } from '@/dictionaries/dictionaries';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const language: SupportedLanguages = getEffectiveLanguage((await params).locale);
  console.log('LocaleLayout: Using language:', language);
  return (
    <DictionaryProvider initialLanguage={language}>
      <PublicTopBar />
      {children}
      <Footer language={language} />
    </DictionaryProvider>
  );
}
