'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/navigation';
import Logo from '@/components/logo';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';

export default function PublicTopBar() {
  const t = useTranslations('public.nav');
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isOnAuthPage = pathname === '/signin' || pathname === '/signup';

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
      <div className='mx-auto max-w-7xl px-8'>
        <div className='flex h-(--topbar-height) items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <Link href='/' className='flex items-center space-x-2' onClick={closeMobileMenu}>
              <Logo variant='icon' showText textSize='md' priority />
            </Link>

            <nav className='hidden items-center space-x-6 md:flex'>
              <ExternalLink
                href='/docs'
                title={t('documentation')}
                className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
              >
                {t('documentation')}
              </ExternalLink>
              <Link
                href='/features'
                className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
              >
                {t('features')}
              </Link>
              <Link
                href='/pricing'
                className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
              >
                {t('pricing')}
              </Link>
            </nav>
          </div>

          <div className='hidden items-center space-x-4 md:flex'>
            {status === 'loading' ? (
              <div className='flex items-center space-x-2'>
                <div className='bg-muted h-4 w-16 animate-pulse rounded' />
              </div>
            ) : session ? (
              <NextLink href='/dashboards'>
                <Button variant='default' className='cursor-pointer'>
                  {t('goToDashboard')}
                </Button>
              </NextLink>
            ) : !isOnAuthPage ? (
              <>
                <Link
                  href='/signin'
                  className='text-foreground hover:text-foreground text-sm font-medium transition-colors'
                >
                  {t('login')}
                </Link>
                <Link href='/signup'>
                  <Button className='cursor-pointer'>{t('getStarted')}</Button>
                </Link>
              </>
            ) : null}
          </div>

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
                href='/#pricing'
                onClick={closeMobileMenu}
                className='text-foreground hover:text-foreground block text-sm font-medium transition-colors'
              >
                {t('pricing')}
              </Link>
              <Link
                href='/features'
                onClick={closeMobileMenu}
                className='text-foreground hover:text-foreground block text-sm font-medium transition-colors'
              >
                {t('features')}
              </Link>
              <ExternalLink
                href='/docs'
                onClick={closeMobileMenu}
                className='text-foreground hover:text-foreground block text-sm font-medium transition-colors'
                title={t('documentation')}
              >
                {t('documentation')}
              </ExternalLink>

              <div className='border-t pt-3'>
                {session ? (
                  <NextLink href='/dashboards' onClick={closeMobileMenu}>
                    <Button variant='default' className='w-full cursor-pointer'>
                      {t('goToDashboard')}
                    </Button>
                  </NextLink>
                ) : !isOnAuthPage ? (
                  <div className='space-y-2'>
                    <Link href='/signup' onClick={closeMobileMenu}>
                      <Button className='w-full cursor-pointer'>{t('getStarted')}</Button>
                    </Link>
                    <Link
                      href='/signin'
                      onClick={closeMobileMenu}
                      className='text-muted-foreground hover:text-foreground block text-center text-sm font-medium transition-colors'
                    >
                      {t('login')}
                    </Link>
                  </div>
                ) : null}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
