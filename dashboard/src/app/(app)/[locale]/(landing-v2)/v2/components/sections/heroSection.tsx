import { Link } from '@/i18n/navigation';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

const copy = COPY.hero;

export function HeroSection() {
  return (
    <section className='hero'>
      <div className='card card--hero'>
        {/* sits on the demo frame's top edge, so it reads as light from behind the frame */}
        <div className='bloom' style={{ top: 628, width: 1220, height: 470 }} aria-hidden />
        <div className='card__body'>
          <div className='pill'>
            <i />
            <span>{copy.pill}</span>
          </div>
          <h1 className='d1'>{copy.title}</h1>
          <p className='lede'>{copy.lede}</p>
          <div className='card__cta'>
            <Link className='btn btn--paper btn--lg' href='/signup'>
              {copy.ctaPrimary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
