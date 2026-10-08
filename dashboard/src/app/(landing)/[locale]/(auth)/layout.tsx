import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { AuthShell } from '@/landing/components/auth/authShell';

/** Sign in, sign up and the password and email steps around them, in the landing's look. */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: SupportedLanguages }>;
}) {
  const { locale } = await params;
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
