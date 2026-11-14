import { AppShell } from '@/app/AppShell';
import { BASE_METADATA } from '@/app/baseMetadata';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
