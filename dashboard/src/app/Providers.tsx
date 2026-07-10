'use client';

import { SessionProvider } from 'next-auth/react';
import { TRPCProvider } from '@/trpc/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <SessionProvider>{children}</SessionProvider>
    </TRPCProvider>
  );
}
