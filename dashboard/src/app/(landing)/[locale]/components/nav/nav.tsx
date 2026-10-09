'use client';

import { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { useHydratedSession } from '@/hooks/use-hydrated-session';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { buttonStyles } from '@/landing/components/ui/button';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';
import { useNavScrollState } from './useNavScrollState';

const NAV_LINKS = [
  { key: 'demo', href: '/demo' },
  { key: 'features', href: '/features' },
  { key: 'pricing', href: '/pricing' },
] as const;
const SHEET_ID = 'landing-nav-sheet';
/** Must match the theme's lg breakpoint, where the links join the bar. */
const WIDE = '(width >= 56.25rem)';

/* the GitHub icon and Sign in share this hover box */
const BOXED =
  'inline-flex h-8 items-center justify-center rounded-[7px] text-fg transition-[background-color] duration-180 ease-out-expo hover:bg-fg/6';
/* muted at rest and white on hover, as nextjs.org does; the inverse read as every item being 'on' */
const NAV_LINK = 'text-muted transition-colors duration-180 ease-out-expo hover:text-fg';
/** Whole pixels (2px bars, 4px gaps, a 14px stack in 36px) so no bar blurs. */
const MENU_BAR = 'h-0.5 w-[18px] bg-current transition-transform duration-220 ease-out-expo';
const SHEET_LINK = 'leading-11 text-fg';

function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations('landing.nav');
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link key={link.href} className={className} href={link.href} onClick={onNavigate}>
          {t(link.key)}
        </Link>
      ))}
      <a className={className} href={LINKS.docs}>
        {t('docs')}
      </a>
    </>
  );
}

/** Signed-out links show while the session loads, so most readers see no shift. */
function useSignedIn() {
  const { data, isPending } = useHydratedSession();
  return !isPending && Boolean(data);
}

function AccountLinks({ buttonClassName }: { buttonClassName?: string }) {
  const t = useTranslations('landing.nav');
  if (useSignedIn()) {
    return (
      <NextLink
        className={buttonStyles({ variant: 'volt', size: 'sm', className: buttonClassName })}
        href='/dashboards'
      >
        {t('goToDashboard')}
      </NextLink>
    );
  }
  return (
    <>
      {/* negative margin keeps the text where it was; the box grows into the gap */}
      <Link className={cn(BOXED, '-mx-2.5 px-2.5 max-lg:hidden')} href='/signin'>
        {t('signIn')}
      </Link>
      <TrackedLink
        className={buttonStyles({ variant: 'volt', size: 'sm', className: buttonClassName })}
        href='/signup'
        placement='nav'
        destination='signup'
      >
        {t('cta')}
      </TrackedLink>
    </>
  );
}

function SheetActions({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations('landing.nav');
  const signedIn = useSignedIn();
  return (
    <div className='mt-8 flex flex-col gap-2.5'>
      {signedIn ? (
        <NextLink
          className={buttonStyles({ variant: 'volt', size: 'lg' })}
          href='/dashboards'
          onClick={onNavigate}
        >
          {t('goToDashboard')}
        </NextLink>
      ) : (
        <>
          <Link className={buttonStyles({ variant: 'line', size: 'lg' })} href='/signin' onClick={onNavigate}>
            {t('signIn')}
          </Link>
          <TrackedLink
            className={buttonStyles({ variant: 'volt', size: 'lg' })}
            href='/signup'
            placement='menu'
            destination='signup'
            onClick={onNavigate}
          >
            {t('cta')}
          </TrackedLink>
        </>
      )}
    </div>
  );
}

export function Nav() {
  const t = useTranslations('landing.nav');
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const { grid, scrolledDown } = useNavScrollState(ref, IDS.band);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (sheetRef.current?.contains(document.activeElement)) menuRef.current?.focus({ preventScroll: true });
      setOpen(false);
    };
    const wide = window.matchMedia(WIDE);
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <header
      ref={ref}
      data-grid={grid || undefined}
      // landing.css locks page scroll on this
      data-open={open || undefined}
      data-stowed={(scrolledDown && !open) || undefined}
      onBlur={(e) => {
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      className={cn(
        'sticky top-0 z-20 grid h-18 grid-cols-[1fr_auto_1fr] items-center data-open:z-40 max-xl:flex max-xl:justify-between max-sm:h-14 max-sm:px-(--pad)',
        // centres the 24px brand mark in the wall column
        'px-[calc(var(--pad)+(var(--wall)-24px)/2)]',
        'transition-[translate] duration-300 ease-out-expo max-md:data-stowed:not-focus-within:-translate-y-full',
        // full-bleed backing, or the band's full-bleed rule shows past the bar
        'before:absolute before:inset-y-0 before:left-1/2 before:-z-1 before:w-screen before:-translate-x-1/2 before:bg-canvas',
        // not animated: it takes over from the band's rule at the same pixel
        'after:bleed-rule after:invisible after:bottom-0 after:bg-rule data-grid:after:visible max-sm:after:hidden',
      )}
    >
      <BrandLink
        className='justify-self-start'
        wordmarkClassName='transition-[opacity,clip-path,visibility] duration-200 ease-out-expo [clip-path:inset(0)] in-data-grid:invisible in-data-grid:opacity-0 in-data-grid:[clip-path:inset(0_100%_0_0)] max-sm:hidden'
      />
      <nav
        className='relative col-start-2 flex gap-7 text-body font-medium tracking-ui text-fg max-lg:hidden'
        aria-label={t('label')}
      >
        <NavLinks className={NAV_LINK} />
      </nav>
      <div className='relative col-start-3 flex items-center gap-5 justify-self-end text-body font-medium tracking-ui text-fg'>
        <a
          className={cn(BOXED, 'w-8 max-lg:hidden')}
          href={LINKS.github}
          target='_blank'
          rel='noopener'
          aria-label={t('githubLabel')}
        >
          <GitHubIcon className='size-[17px]' />
        </a>
        <AccountLinks buttonClassName={cn(open && 'max-lg:hidden')} />
        <button
          ref={menuRef}
          type='button'
          className='hidden size-9 flex-col items-center justify-center gap-1 rounded-[7px] text-fg max-lg:flex'
          aria-label={t('menu')}
          aria-expanded={open}
          aria-controls={SHEET_ID}
          onClick={() => setOpen((o) => !o)}
        >
          {/* translate-y-1.5 = one bar + one gap, so the outer bars meet in the middle */}
          <i className={cn(MENU_BAR, open && 'translate-y-1.5 rotate-45')} />
          <i className={cn(MENU_BAR, 'transition-opacity', open && 'opacity-0')} />
          <i className={cn(MENU_BAR, open && '-translate-y-1.5 -rotate-45')} />
        </button>
      </div>
      <nav
        ref={sheetRef}
        id={SHEET_ID}
        className='fixed inset-x-0 top-18 bottom-0 flex flex-col overflow-y-auto overscroll-contain bg-canvas px-[calc(var(--pad)+(var(--wall)-24px)/2)] py-6 text-[1.375rem] tracking-ui max-sm:top-14 max-sm:px-(--pad)'
        aria-label={t('label')}
        hidden={!open}
      >
        <NavLinks className={SHEET_LINK} onNavigate={() => setOpen(false)} />
        <a
          className={cn(SHEET_LINK, 'flex items-center gap-3')}
          href={LINKS.github}
          target='_blank'
          rel='noopener'
        >
          <GitHubIcon className='size-5' />
          GitHub
        </a>
        <SheetActions onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  );
}
