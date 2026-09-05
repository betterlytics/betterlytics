import { Link } from '@/i18n/navigation';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

const copy = COPY.hero;

export function HeroSection() {
  return (
    <section className='hero'>
      <div className='card card--hero'>
        <div className='bloom' style={{ top: 726, width: 1080, height: 470 }} aria-hidden />
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
            <a className='btn btn--onvolt btn--lg' href={`#${IDS.demo}`}>
              {copy.ctaDemo}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
