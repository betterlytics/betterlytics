'use client';

import { NextIntlClientProvider, type AbstractIntlMessages, type Locale } from 'next-intl';
import { SessionProvider } from 'next-auth/react';

/**
 * Client boundary for the status 404 page.
 *
 * `next-auth`'s `SessionProvider` reads React context, so it can't be rendered directly from a
 * Server Component — it has to sit inside a `'use client'` module (the same reason the app's shared
 * `Providers` is a client component). The server-rendered chrome (top bar, footer, message) is
 * passed in as `children` across this boundary.
 */
export function StatusNotFoundShell({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>{children}</SessionProvider>
    </NextIntlClientProvider>
  );
}
