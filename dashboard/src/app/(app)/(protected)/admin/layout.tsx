import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentAdminActor } from '@/auth/admin-auth';
import { getAvailableAdminSections } from '@/entities/admin/adminAccess.entities';
import BATopbar from '@/components/topbar/BATopbar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import BASidebarProvider from '@/components/sidebar/BASidebarProvider';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { AdminSidebar } from './_components/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await getCurrentAdminActor();
  if (!actor) notFound();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={getPublicEnvironmentVariables()}>
      <section className='h-full w-full'>
        <BATopbar />
        <main className='bg-background w-full overflow-x-hidden'>
          <BASidebarProvider>
            <AdminSidebar edition={actor.edition} sections={getAvailableAdminSections(actor.edition)} />
            <BAMobileSidebarTrigger />
            <div className='flex w-full justify-center md:mt-14'>{children}</div>
          </BASidebarProvider>
        </main>
      </section>
    </PublicEnvironmentVariablesProvider>
  );
}
