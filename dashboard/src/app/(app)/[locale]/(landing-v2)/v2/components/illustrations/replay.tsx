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
          <CursorGlyph outline />
          <span className='sr__click'>Cursor click captured</span>
        </span>
        <span className='sr__tag'>Rage click · 3×</span>
      </div>
      {/* the play footer: label and status, the scrub track with its knob and markers, then the controls row */}
      <div className='sr__bar'>
        <div className='sr__row'>
          <b>Session playback</b>
          <u>
            <s />
            Playing
          </u>
        </div>
        <span className='sr__tr'>
          <em style={{ left: '8%' }} />
          <em style={{ left: '31%' }} />
          <em className='sr__tr--rage' style={{ left: '58%' }} />
          <em style={{ left: '79%' }} />
          <i />
        </span>
        <div className='sr__row sr__ctl'>
          <svg viewBox='0 0 12 12' aria-hidden>
            <rect x='2' y='1.5' width='3' height='9' rx='0.8' />
            <rect x='7' y='1.5' width='3' height='9' rx='0.8' />
          </svg>
          <time>03:21</time>
          <span>/</span>
          <time>12:44</time>
          <svg className='sr__max' viewBox='0 0 12 12' aria-hidden>
            <path d='M7 1.5h3.5V5M5 10.5H1.5V7M10.5 1.5 7 5M1.5 10.5 5 7' />
          </svg>
        </div>
      </div>
    </div>
  );
}
