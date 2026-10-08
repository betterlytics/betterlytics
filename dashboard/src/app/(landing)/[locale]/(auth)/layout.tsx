import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AuthShell } from '@/landing/components/auth/authShell';

// Every auth page reads the session, so none can be cached: rendered per request, never prerendered with the landing
export const dynamic = 'force-dynamic';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  // only the auth copy reaches the browser, without each page's SEO strings
  const auth = Object.fromEntries(
    Object.entries(messages.public.auth).map(([page, copy]) => [
      page,
      Object.fromEntries(Object.entries(copy).filter(([key]) => key !== 'seo')),
    ]),
  );

  return (
    <NextIntlClientProvider messages={{ public: { auth } }}>
      <AuthShell>{children}</AuthShell>
    </NextIntlClientProvider>
  );
}
