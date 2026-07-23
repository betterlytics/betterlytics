'use client';

import { ThemeProvider } from '@/app/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function BaseProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
