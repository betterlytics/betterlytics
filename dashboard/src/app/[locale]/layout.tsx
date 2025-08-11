import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>;
}
