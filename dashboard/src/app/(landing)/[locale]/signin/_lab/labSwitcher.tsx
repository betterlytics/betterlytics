'use client';

import { useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/landing/lib/cn';
import { PREVIEW_STATES, VARIANTS, type VariantSlug } from './variants';
import styles from './labSwitcher.module.css';

type Params = Record<string, string | null>;

/** Review tool only: flips between directions and pins states. ←/→ switch, H hides it. */
export function LabSwitcher({ current }: { current: VariantSlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const index = VARIANTS.findIndex((variant) => variant.slug === current);
  const localePrefix = pathname.replace(/\/signin\/[^/]+$/, '');
  const state = searchParams.get('state');
  const signupOff = searchParams.get('signup') === 'off';
  const oauthOff = searchParams.get('oauth') === 'off';

  const href = (slug: string, overrides: Params = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    return `${localePrefix}/signin/${slug}${query ? `?${query}` : ''}`;
  };
  const step = (by: number) => VARIANTS[(index + by + VARIANTS.length) % VARIANTS.length].slug;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') router.push(href(step(1)));
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') router.push(href(step(-1)));
      else if (event.key.toLowerCase() === 'h') setHidden((value) => !value);
      else if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [menuOpen]);

  if (hidden) {
    return (
      <button type='button' className={styles.restore} onClick={() => setHidden(false)} aria-label='Show the design lab (H)'>
        <i className={styles.dot} />
      </button>
    );
  }

  const stateLabel = PREVIEW_STATES.find((entry) => entry.key === state)?.label ?? 'Default';
  const modifiers = [signupOff && 'sign-ups closed', oauthOff && 'no OAuth'].filter(Boolean);
  const pinned = Boolean(state) || modifiers.length > 0;

  return (
    <div className={styles.bar} role='navigation' aria-label='Sign-in design lab'>
      <span className={styles.tag} aria-hidden>
        <i className={styles.dot} />
      </span>
      {VARIANTS.map((variant) => (
        <NextLink
          key={variant.slug}
          href={href(variant.slug)}
          className={cn(styles.tab, variant.slug === current && styles.active)}
          aria-current={variant.slug === current ? 'page' : undefined}
          aria-label={`${variant.letter}: ${variant.name}`}
        >
          {variant.letter}
          <span className={styles.tip} aria-hidden>
            <b>{variant.name}</b>
            {variant.blurb}
          </span>
        </NextLink>
      ))}
      <span className={styles.sep} />
      <div className={styles.menuWrap} ref={menuRef}>
        <button
          type='button'
          className={cn(styles.tab, menuOpen && styles.pressed)}
          aria-expanded={menuOpen}
          aria-haspopup='menu'
          aria-label={`Preview state: ${stateLabel}`}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <svg viewBox='0 0 16 16' className={styles.glyph} aria-hidden>
            <path d='M2.5 4.5h7M12.5 4.5h1M2.5 11.5h1M6.5 11.5h7' />
            <circle cx='11' cy='4.5' r='1.5' />
            <circle cx='5' cy='11.5' r='1.5' />
          </svg>
          {pinned ? <i className={styles.flag} /> : null}
          {!menuOpen ? (
            <span className={styles.tip} aria-hidden>
              <b>Preview state</b>
              {[stateLabel, ...modifiers].join(' · ')}
            </span>
          ) : null}
        </button>
        {menuOpen ? (
          <div className={styles.menu} role='menu'>
            <p className={styles.menuTitle}>Preview state</p>
            {PREVIEW_STATES.map((entry) => (
              <NextLink
                key={entry.label}
                role='menuitemradio'
                aria-checked={entry.key === state}
                className={styles.menuItem}
                href={href(current, { state: entry.key })}
                onClick={() => setMenuOpen(false)}
              >
                <i className={styles.radio} />
                {entry.label}
              </NextLink>
            ))}
            <p className={styles.menuTitle}>Instance</p>
            <NextLink
              role='menuitemcheckbox'
              aria-checked={signupOff}
              className={styles.menuItem}
              href={href(current, { signup: signupOff ? null : 'off' })}
              onClick={() => setMenuOpen(false)}
            >
              <i className={styles.check} />
              Sign-ups closed (self-host)
            </NextLink>
            <NextLink
              role='menuitemcheckbox'
              aria-checked={oauthOff}
              className={styles.menuItem}
              href={href(current, { oauth: oauthOff ? null : 'off' })}
              onClick={() => setMenuOpen(false)}
            >
              <i className={styles.check} />
              No Google / GitHub
            </NextLink>
            <p className={styles.hint}>← → switch direction · H hides this</p>
          </div>
        ) : null}
      </div>
      <button type='button' className={styles.tab} onClick={() => setHidden(true)} aria-label='Hide the design lab (H)'>
        <svg viewBox='0 0 16 16' className={styles.glyph} aria-hidden>
          <path d='M4.5 4.5l7 7M11.5 4.5l-7 7' />
        </svg>
      </button>
    </div>
  );
}
