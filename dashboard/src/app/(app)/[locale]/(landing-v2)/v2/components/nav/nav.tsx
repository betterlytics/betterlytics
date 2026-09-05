'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { GitHubIcon } from '@/components/icons/SocialIcons';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/brandMark';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';
import { useNavScrollState } from './useNavScrollState';

const copy = COPY.nav;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {copy.links.map((link) => (
        <a key={link.anchor} href={`#${IDS[link.anchor]}`} onClick={onNavigate}>
          {link.label}
        </a>
      ))}
      <a href={LINKS.docs}>{copy.docs}</a>
    </>
  );
}

function AccountLinks({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  if (status === 'loading') return <span className='nav__skel' aria-hidden />;
  if (session) {
    return (
      <NextLink className={cn('btn btn--volt btn--sm', className)} href='/dashboards'>
        {copy.goToDashboard}
      </NextLink>
    );
  }
  return (
    <>
      <Link className={cn('sign', className)} href='/signin'>
        {copy.signIn}
      </Link>
      <Link className={cn('btn btn--volt btn--sm', className)} href='/signup'>
        {copy.cta}
      </Link>
    </>
  );
}

/**
 * Sticky, opaque bar. Two independent things happen on scroll: the middle
 * items retire as soon as you move, and the rule under the bar lands only
 * once the nav is past the hero, because the wall doesn't exist behind the
 * hero. Below the desktop breakpoint the links move into a sheet.
 */
export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const { min, grid } = useNavScrollState(ref, IDS.band);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <header ref={ref} className={cn('nav', min && 'is-min', grid && 'is-grid', open && 'is-open')}>
      <Link className='brand' href='/' aria-label={copy.home}>
        <BrandMark />
        <b>BETTERLYTICS</b>
      </Link>
      <nav className='nav__links' aria-label='Primary'>
        <NavLinks />
      </nav>
      <div className='nav__end'>
        <a
          className='nav__gh'
          href={LINKS.github}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={copy.github}
        >
          <GitHubIcon />
        </a>
        <AccountLinks />
        <button
          type='button'
          className='nav__menu'
          aria-label={copy.menu}
          aria-expanded={open}
          aria-controls='lp2-nav-sheet'
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <i />
        </button>
      </div>
      <nav id='lp2-nav-sheet' className='nav__sheet' aria-label='Primary' hidden={!open}>
        <NavLinks onNavigate={() => setOpen(false)} />
      </nav>
    </header>
  );
}
