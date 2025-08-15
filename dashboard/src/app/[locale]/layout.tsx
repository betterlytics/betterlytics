import { SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';
import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}
