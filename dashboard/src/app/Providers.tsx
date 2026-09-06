'use client';

import { TRPCProvider } from '@/trpc/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
