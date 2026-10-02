'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { buttonStyles } from '@/landing/components/ui/button';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';
import { useNavScrollState } from './useNavScrollState';

const copy = COPY.nav;
const SHEET_ID = 'landing-nav-sheet';
/** Where the links leave the sheet for the bar (the theme's xl breakpoint). */
const WIDE = '(width >= 62.5rem)';

/** Links hover by dipping rather than lifting. */
const QUIET_LINK = 'transition-opacity duration-180 ease-out-expo hover:opacity-80';
/** One bar of the menu button: whole pixels throughout (2px bars, 4px gaps, a 14px stack centred in 36px), so every bar lands on a pixel row and none blurs. */
const MENU_BAR = 'h-0.5 w-[18px] bg-current transition-transform duration-220 ease-out-expo';
/** A row in the sheet; on phones, where the sheet has the screen, a larger row without rules. */
const SHEET_LINK = 'border-t border-rule-08 py-3 text-fg max-sm:border-t-0 max-sm:py-0 max-sm:leading-11';

function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <>
      {copy.links.map((link) => (
        <Link key={link.href} className={className} href={link.href} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
      <a className={className} href={LINKS.docs}>
        {copy.docs}
      </a>
    </>
  );
}

/**
 * Sign in and sign up, or the way back to the dashboard once the session says the
 * reader has an account. Most readers have none, so the signed-out links are what
 * the static page ships and what shows while the session loads: nothing moves for them.
 * `buttonClassName` goes to the button.
 */
function AccountLinks({ buttonClassName }: { buttonClassName?: string }) {
  const { data: session } = useSession();
  if (session) {
    return (
      <NextLink
        className={buttonStyles({ variant: 'volt', size: 'sm', className: buttonClassName })}
        href='/dashboards'
      >
        {copy.goToDashboard}
      </NextLink>
    );
  }
  return (
    <>
      <Link className={cn(QUIET_LINK, 'max-sm:hidden')} href='/signin'>
        {copy.signIn}
      </Link>
      <TrackedLink
        className={buttonStyles({ variant: 'volt', size: 'sm', className: buttonClassName })}
        href='/signup'
        placement='nav'
        destination='signup'
      >
        {copy.cta}
      </TrackedLink>
    </>
  );
}

/**
 * The account actions under the sheet's links, on phones only: there the bar has no
 * room for Sign in, and the open menu takes the bar's button into the sheet too. Full
 * width, the call to action last; signed in, the way back to the dashboard alone.
 */
function SheetActions({ onNavigate }: { onNavigate: () => void }) {
  const { data: session } = useSession();
  return (
    <div className='mt-8 flex flex-col gap-2.5 sm:hidden'>
      {session ? (
        <NextLink
          className={buttonStyles({ variant: 'volt', size: 'lg' })}
          href='/dashboards'
          onClick={onNavigate}
        >
          {copy.goToDashboard}
        </NextLink>
      ) : (
        <>
          <Link className={buttonStyles({ variant: 'line', size: 'lg' })} href='/signin' onClick={onNavigate}>
            {copy.signIn}
          </Link>
          <TrackedLink
            className={buttonStyles({ variant: 'volt', size: 'lg' })}
            href='/signup'
            placement='menu'
            destination='signup'
            onClick={onNavigate}
          >
            {copy.cta}
          </TrackedLink>
        </>
      )}
    </div>
  );
}

/**
 * Sticky and opaque; every item stays put while scrolling. The links sit on the
 * page's centre line whatever the width of the brand and the account side (equal
 * outer tracks). The rule under the bar lands only once the nav is past the hero,
 * where the wall begins. Below xl the links move into a sheet.
 */
export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const { grid } = useNavScrollState(ref, IDS.band);
  const [open, setOpen] = useState(false);

  // An open sheet closes on Escape, handing focus back to the button if it was inside
  // the sheet, and closes by itself once the window widens past the bar's breakpoint.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (sheetRef.current?.contains(document.activeElement)) menuRef.current?.focus();
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
      // on phones the open menu covers the page, which holds still under it (see landing.css)
      data-open={open || undefined}
      // the sheet closes once focus moves on past it, rather than into the page it covers
      onBlur={(e) => {
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      className={cn(
        'sticky top-0 z-20 grid h-18 grid-cols-[1fr_auto_1fr] items-center px-6 max-xl:flex max-sm:h-14 max-sm:px-(--pad)',
        // the page is capped in width but the band's rule is full-bleed, so the opaque
        // backing is full-bleed too, or the rule would show past the bar once under it
        'before:absolute before:inset-y-0 before:left-1/2 before:-z-1 before:w-screen before:-translate-x-1/2 before:bg-canvas',
        // the band's top rule hands over to this one at the pixel where they coincide, so
        // it switches without animation: a half-drawn rule would show beside the band's
        'after:bleed-rule after:invisible after:bottom-0 after:bg-rule data-grid:after:visible max-sm:after:hidden',
      )}
    >
      <BrandLink className='justify-self-start' compact />
      <nav
        className='relative col-start-2 flex gap-7 text-body font-medium tracking-ui text-fg max-xl:hidden'
        aria-label={copy.label}
      >
        <NavLinks className={QUIET_LINK} />
      </nav>
      <div className='relative col-start-3 flex items-center gap-5 justify-self-end text-body font-medium tracking-ui text-fg max-xl:ml-auto'>
        {/* GitHub sits with the links, not the call to action: a destination, not an action.
            Off the bar on phones, which keep only the call to action and the menu. */}
        <a
          className='inline-flex size-8 items-center justify-center rounded-[7px] text-fg transition-[opacity,background-color] duration-180 ease-out-expo hover:bg-fg/6 hover:opacity-80 max-sm:hidden'
          href={LINKS.github}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={copy.githubLabel}
        >
          <GitHubIcon className='size-[17px]' />
        </a>
        {/* on phones the open menu has its own, so the bar keeps only the brand and the menu button */}
        <AccountLinks buttonClassName={cn(open && 'max-sm:hidden')} />
        <button
          ref={menuRef}
          type='button'
          className='hidden size-9 flex-col items-center justify-center gap-1 rounded-[7px] text-fg max-xl:flex'
          aria-label={copy.menu}
          aria-expanded={open}
          aria-controls={SHEET_ID}
          onClick={() => setOpen((o) => !o)}
        >
          {/* three bars; open, the outer two meet in the middle (a bar and a gap away) and
              cross into an X while the middle one fades */}
          <i className={cn(MENU_BAR, open && 'translate-y-1.5 rotate-45')} />
          <i className={cn(MENU_BAR, 'transition-opacity', open && 'opacity-0')} />
          <i className={cn(MENU_BAR, open && '-translate-y-1.5 -rotate-45')} />
        </button>
      </div>
      <nav
        ref={sheetRef}
        id={SHEET_ID}
        className={cn(
          'absolute inset-x-0 top-full flex flex-col border-b border-rule bg-canvas px-(--pad) pt-2 pb-[18px] text-title tracking-ui',
          // on phones it takes the whole screen under the bar, scrolling by itself on one too short for it
          'max-sm:fixed max-sm:top-14 max-sm:bottom-0 max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:border-b-0 max-sm:py-6 max-sm:text-[1.375rem]',
        )}
        aria-label={copy.label}
        hidden={!open}
      >
        <NavLinks className={SHEET_LINK} onNavigate={() => setOpen(false)} />
        {/* the bar's GitHub button, as a row on phones, where the bar has no room for it */}
        <a
          className={cn(SHEET_LINK, 'flex items-center gap-3 sm:hidden')}
          href={LINKS.github}
          target='_blank'
          rel='noopener noreferrer'
        >
          <GitHubIcon className='size-5' />
          {copy.github}
        </a>
        <SheetActions onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  );
}
