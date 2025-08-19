import { NextIntlClientProvider } from 'next-intl';

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
