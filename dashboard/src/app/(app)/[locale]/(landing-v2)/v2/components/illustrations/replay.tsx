import { CursorGlyph } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/cursorGlyph';

/* Illustration copy is mock product UI, kept literal on purpose. */

/**
 * A browser being replayed. The light viewport against the dark product
 * chrome is what makes it read as someone else's site. All motion is CSS,
 * gated by the card's `is-live` class.
 */
export function Replay() {
  return (
    <div className='sr'>
      <div className='sr__ch'>
        <i />
        <i />
        <i />
        <span>https://example.com/pricing</span>
      </div>
      <div className='sr__vp'>
        <div className='sr__wire'>
          <span className='sr__nav' />
          <span className='sr__h1' />
          <span className='sr__h2' />
          <div className='sr__cards'>
            <span />
            <span />
            <span />
          </div>
          <span className='sr__cta' />
        </div>
        <span className='sr__rip' />
        <span className='sr__cur'>
          <CursorGlyph dark />
        </span>
        <span className='sr__tag'>Rage click · 3×</span>
      </div>
      <div className='sr__bar'>
        <b>Session replay</b>
        <u>
          <s />
          Playing
        </u>
        <span className='sr__tr'>
          <i />
          <em style={{ left: '31%' }} />
          <em style={{ left: '58%', background: 'var(--down)', opacity: 0.9 }} />
          <em style={{ left: '79%' }} />
        </span>
        <time>12:44</time>
      </div>
    </div>
  );
}
