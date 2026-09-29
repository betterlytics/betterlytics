'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { buttonStyles } from '@/landing/components/ui/button';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';
import { useNavScrollState } from './useNavScrollState';

const copy = COPY.nav;
const SHEET_ID = 'landing-nav-sheet';

/** Links hover by dipping rather than lifting. */
const QUIET_LINK = 'transition-opacity duration-180 ease-out-expo hover:opacity-80';

function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <>
      {copy.links.map((link) => (
        <a key={link.anchor} className={className} href={`#${IDS[link.anchor]}`} onClick={onNavigate}>
          {link.label}
        </a>
      ))}
      <a className={className} href={LINKS.docs}>
        {copy.docs}
      </a>
    </>
  );
}

/** Sign in and sign up, or the way back to the dashboard once the session says the reader has an account. */
function AccountLinks() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <span className='h-4 w-16 rounded-sm bg-rule-10' aria-hidden />;
  if (session) {
    return (
      <NextLink className={buttonStyles({ variant: 'volt', size: 'sm' })} href='/dashboards'>
        {copy.goToDashboard}
      </NextLink>
    );
  }
  return (
    <>
      <Link className={cn(QUIET_LINK, 'max-sm:hidden')} href='/signin'>
        {copy.signIn}
      </Link>
      <Link className={buttonStyles({ variant: 'volt', size: 'sm' })} href='/signup'>
        {copy.cta}
      </Link>
    </>
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
  const { grid } = useNavScrollState(ref, IDS.band);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <header
      ref={ref}
      data-grid={grid || undefined}
      className={cn(
        'sticky top-0 z-20 grid h-18 grid-cols-[1fr_auto_1fr] items-center px-6 max-xl:flex max-sm:px-(--pad)',
        // the page is capped in width but the band's rule is full-bleed, so the opaque
        // backing is full-bleed too, or the rule would show past the bar once under it
        'before:absolute before:inset-y-0 before:left-1/2 before:-z-1 before:w-screen before:-translate-x-1/2 before:bg-canvas',
        // the band's top rule hands over to this one at the pixel where they coincide, so
        // it switches without animation: a half-drawn rule would show beside the band's
        'after:bleed-rule after:bottom-0 after:bg-rule after:invisible data-grid:after:visible max-sm:after:hidden',
      )}
    >
      <BrandLink className='justify-self-start' />
      <nav
        className='relative col-start-2 flex gap-7 text-body font-medium tracking-ui text-fg max-xl:hidden'
        aria-label='Primary'
      >
        <NavLinks className={QUIET_LINK} />
      </nav>
      <div className='relative col-start-3 flex items-center gap-5 justify-self-end text-body font-medium tracking-ui text-fg max-xl:ml-auto'>
        {/* GitHub sits with the links, not the call to action: a destination, not an action */}
        <a
          className='inline-flex size-8 items-center justify-center rounded-[7px] text-fg transition-[opacity,background-color] duration-180 ease-out-expo hover:bg-fg/6 hover:opacity-80'
          href={LINKS.github}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={copy.github}
        >
          <GitHubIcon className='size-[17px]' />
        </a>
        <AccountLinks />
        <button
          type='button'
          className='hidden size-9 flex-col items-center justify-center gap-[5px] rounded-[7px] text-fg max-xl:flex'
          aria-label={copy.menu}
          aria-expanded={open}
          aria-controls={SHEET_ID}
          onClick={() => setOpen((o) => !o)}
        >
          <i
            className={cn(
              'h-[1.5px] w-[18px] bg-current transition-transform duration-220 ease-out-expo',
              open && 'translate-y-[3.25px] rotate-45',
            )}
          />
          <i
            className={cn(
              'h-[1.5px] w-[18px] bg-current transition-transform duration-220 ease-out-expo',
              open && '-translate-y-[3.25px] -rotate-45',
            )}
          />
        </button>
      </div>
      <nav
        id={SHEET_ID}
        className='absolute inset-x-0 top-full flex flex-col border-b border-rule bg-canvas px-(--pad) pt-2 pb-[18px] text-title tracking-ui'
        aria-label='Primary'
        hidden={!open}
      >
        <NavLinks className='border-t border-rule-08 py-3 text-fg' onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  );
}
