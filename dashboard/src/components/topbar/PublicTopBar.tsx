'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Link, usePathname } from '@/i18n/navigation';
import Logo from '@/components/logo';
import { useState } from 'react';
import { Blend, Grid3x3, Menu, X } from 'lucide-react';
import ExternalLink from '@/components/ExternalLink';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useHeroBackground,
  type HeroBackground,
  type HeroGradient,
} from '@/components/landing/background-context';

export default function PublicTopBar() {
  const t = useTranslations('public.nav');
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { background, setBackground, gradients, toggleGradient } = useHeroBackground();

  const isLandingPage = pathname === '/';

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
          <div className='flex items-center'>
            <Link href='/' className='flex items-center space-x-2' onClick={closeMobileMenu}>
              <Logo variant='icon' showText textSize='md' priority />
            </Link>
          </div>

          <div className='hidden items-center md:flex'>
            <nav className='flex items-center space-x-6'>
              <ExternalLink
                href='https://betterlytics.io/docs'
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

            <div className='ml-6 flex items-center gap-6'>
              {isLandingPage && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className='text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
                        aria-label='Switch background'
                      >
                        <Grid3x3 className='h-5 w-5' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Background</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup
                        value={background}
                        onValueChange={(v) => setBackground(v as HeroBackground)}
                      >
                        <DropdownMenuRadioItem value='retro-grid'>
                          Retro Grid
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value='grid'>Grid</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value='dots'>Dots</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value='diagonal-stripes'>
                          Diagonal Lines
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className='text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
                        aria-label='Switch gradient'
                      >
                        <Blend className='h-5 w-5' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Gradient</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={gradients.has('bottom-fade')}
                        onCheckedChange={() => toggleGradient('bottom-fade')}
                      >
                        Bottom Fade
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={gradients.has('text-spotlight')}
                        onCheckedChange={() => toggleGradient('text-spotlight')}
                      >
                        Text Spotlight
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={gradients.has('radial-center')}
                        onCheckedChange={() => toggleGradient('radial-center')}
                      >
                        Radial Center
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={gradients.has('top-vignette')}
                        onCheckedChange={() => toggleGradient('top-vignette')}
                      >
                        Top Vignette
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={gradients.has('blue-wash')}
                        onCheckedChange={() => toggleGradient('blue-wash')}
                      >
                        Blue Wash
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <ExternalLink
                href='https://github.com/betterlytics/betterlytics'
                className='text-muted-foreground hover:text-foreground transition-colors'
                title='GitHub'
                target='_blank'
                rel='noopener noreferrer'
              >
                <GitHubIcon className='h-5 w-5' />
              </ExternalLink>
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
                <div className='flex items-center space-x-2'>
                  <Link href='/signin'>
                    <Button variant='outline' className='cursor-pointer'>
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href='/signup'>
                    <Button className='cursor-pointer'>{t('getStarted')}</Button>
                  </Link>
                </div>
              ) : null}
            </div>
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
                href='https://betterlytics.io/docs'
                onClick={closeMobileMenu}
                className='text-foreground hover:text-foreground block text-sm font-medium transition-colors'
                title={t('documentation')}
              >
                {t('documentation')}
              </ExternalLink>
              <ExternalLink
                href='https://github.com/betterlytics/betterlytics'
                onClick={closeMobileMenu}
                className='text-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors'
                title='GitHub'
                target='_blank'
                rel='noopener noreferrer'
              >
                <GitHubIcon className='mr-2 h-4 w-4' />
                GitHub
              </ExternalLink>

              <div className='border-t pt-3'>
                {session ? (
                  <NextLink href='/dashboards' onClick={closeMobileMenu}>
                    <Button variant='default' className='w-full cursor-pointer'>
                      {t('goToDashboard')}
                    </Button>
                  </NextLink>
                ) : !isOnAuthPage ? (
                  <div className='flex flex-col gap-2'>
                    <Link href='/signup' onClick={closeMobileMenu}>
                      <Button className='w-full cursor-pointer'>{t('getStarted')}</Button>
                    </Link>
                    <Link href='/signin' onClick={closeMobileMenu}>
                      <Button variant='outline' className='w-full cursor-pointer'>
                        {t('login')}
                      </Button>
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
