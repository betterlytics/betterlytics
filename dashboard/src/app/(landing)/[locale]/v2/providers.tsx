'use client';

import { SessionProvider } from 'next-auth/react';

/** The landing's client context: the session only, which the nav reads to offer the dashboard. */
export function LandingProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
