'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '@/components/logo';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function PublicTopBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignIn = () => {
    router.push('/signin');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isOnSignInPage = pathname === '/signin';

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
      <div className='mx-auto max-w-7xl px-8'>
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Link href='/' className='flex items-center space-x-2' onClick={closeMobileMenu}>
              <Logo variant='icon' showText textSize='md' priority />
            </Link>
          </div>

          <nav className='hidden items-center space-x-6 md:flex'>
            <a
              href='/docs'
              title='Complete Betterlytics Documentation'
              className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            >
              Documentation
            </a>
            <Link
              href='#pricing'
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

          <button
            className='flex items-center justify-center p-2 md:hidden'
            onClick={toggleMobileMenu}
            aria-label='Toggle menu'
          >
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className='border-t md:hidden'>
            <nav className='space-y-3 py-4'>
              <Link
                href='#pricing'
                onClick={closeMobileMenu}
                className='text-muted-foreground hover:text-foreground block text-sm font-medium transition-colors'
              >
                Pricing
              </Link>
              <a
                href='/docs'
                onClick={closeMobileMenu}
                className='text-muted-foreground hover:text-foreground block text-sm font-medium transition-colors'
                title='Complete Betterlytics Documentation'
              >
                Documentation
              </a>

              <div className='border-t pt-3'>
                {session ? (
                  <Link href='/dashboards' onClick={closeMobileMenu}>
                    <Button variant='default' className='w-full'>
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : !isOnSignInPage ? (
                  <Link href='/signin' onClick={closeMobileMenu}>
                    <Button onClick={handleSignIn} className='w-full'>
                      Get Started
                    </Button>
                  </Link>
                ) : null}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
