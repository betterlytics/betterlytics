import { NextIntlClientProvider } from 'next-intl';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
