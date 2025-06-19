'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '@/components/logo';

export default function PublicTopBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignIn = () => {
    router.push('/signin');
  };

  const isOnSignInPage = pathname === '/signin';

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
      <div className='container flex h-14 items-center justify-between px-4'>
        <div className='flex items-center space-x-2'>
          <Link href='/' className='flex items-center space-x-2'>
            <Logo variant='icon' showText textSize='md' priority />
          </Link>
        </div>

        <nav className='hidden items-center space-x-6 md:flex'>
          <Link
            href='/docs'
            className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          >
            Documentation
          </Link>
          <Link
            href='/pricing'
            className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          >
            Pricing
          </Link>

          <div className='flex items-center space-x-4'>
            {status === 'loading' ? (
              <div className='flex items-center space-x-2'>
                <div className='bg-muted h-4 w-16 animate-pulse rounded' />
              </div>
            ) : session ? (
              <Link href='/dashboards'>
                <Button variant='default'>Go to Dashboard</Button>
              </Link>
            ) : !isOnSignInPage ? (
              <Link href='/signin'>
                <Button onClick={handleSignIn}>Get Started</Button>
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
