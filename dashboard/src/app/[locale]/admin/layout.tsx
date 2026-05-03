import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCachedSession } from '@/auth/api-auth';
import { assertSuperAdmin } from '@/auth/superAdmin-auth';
import { ForbiddenError } from '@/lib/exceptions';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV_LINKS = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/bug-reports', label: 'Bug Reports' },
  { href: '/admin/audit-log', label: 'Audit Log' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();

  try {
    assertSuperAdmin(session);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='bg-background border-b px-6 py-3'>
        <div className='flex items-center gap-6'>
          <span className='text-muted-foreground text-sm font-semibold tracking-wider uppercase'>Admin</span>
          <nav className='flex items-center gap-4'>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className='text-muted-foreground hover:text-foreground text-sm transition-colors'
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className='text-muted-foreground ml-auto text-xs'>{session!.user.email}</div>
        </div>
      </header>
      <main className='flex-1 p-6'>{children}</main>
    </div>
  );
}
