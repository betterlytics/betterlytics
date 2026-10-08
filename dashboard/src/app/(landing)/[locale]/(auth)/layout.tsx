import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AuthShell } from '@/landing/components/auth/authShell';

/*
 * Every auth page reads the session, so none can be cached. Without this they would inherit the landing's empty
 * generateStaticParams, be built as static-on-first-request, and fail in production on their first headers() read.
 */
export const dynamic = 'force-dynamic';

/** Sign in, sign up and the password and email steps around them, in the landing's look. */
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
  // only what the forms read reaches the browser: the auth copy, without each page's SEO strings
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
