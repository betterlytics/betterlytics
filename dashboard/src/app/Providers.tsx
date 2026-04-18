'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/app/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TRPCProvider } from '@/trpc/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </TRPCProvider>
  );
}
