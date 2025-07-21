'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '@/components/logo';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

export default function PublicTopBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { dictionary, currentLanguage } = useDictionary();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignIn = () => {
    router.push(`/${currentLanguage}/signin`);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isOnSignInPage = pathname.includes('/signin');

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
      <div className='mx-auto max-w-7xl px-8'>
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Link href={`/${currentLanguage}`} className='flex items-center space-x-2' onClick={closeMobileMenu}>
              <Logo variant='icon' showText textSize='md' priority />
            </Link>
          </div>

          <nav className='hidden items-center space-x-6 md:flex'>
            <a
              href='/docs'
              title={dictionary.public.topbar.documentationTitle}
              className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            >
              {dictionary.public.topbar.documentation}
            </a>
            <Link
              href={`/${currentLanguage}/#pricing`}
              className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            >
              {dictionary.public.topbar.pricing}
            </Link>

            <div className='flex items-center space-x-4'>
              {status === 'loading' ? (
                <div className='flex items-center space-x-2'>
                  <div className='bg-muted h-4 w-16 animate-pulse rounded' />
                </div>
              ) : session ? (
                <Link href='/dashboards'>
                  <Button variant='default'>{dictionary.public.topbar.toDashboard}</Button>
                </Link>
              ) : !isOnSignInPage ? (
                <Link href={`/${currentLanguage}/signin`}>
                  <Button onClick={handleSignIn}>{dictionary.public.topbar.getStarted}</Button>
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
                href={`/${currentLanguage}/#pricing`}
                onClick={closeMobileMenu}
                className='text-muted-foreground hover:text-foreground block text-sm font-medium transition-colors'
              >
                {dictionary.public.topbar.pricing}
              </Link>
              <a
                href='/docs'
                onClick={closeMobileMenu}
                className='text-muted-foreground hover:text-foreground block text-sm font-medium transition-colors'
                title={dictionary.public.topbar.documentationTitle}
              >
                {dictionary.public.topbar.documentation}
              </a>

              <div className='border-t pt-3'>
                {session ? (
                  <Link href='/dashboards' onClick={closeMobileMenu}>
                    <Button variant='default' className='w-full'>
                      {dictionary.public.topbar.toDashboard}
                    </Button>
                  </Link>
                ) : !isOnSignInPage ? (
                  <Link href={`/${currentLanguage}/signin`} onClick={closeMobileMenu}>
                    <Button onClick={handleSignIn} className='w-full'>
                      {dictionary.public.topbar.getStarted}
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
