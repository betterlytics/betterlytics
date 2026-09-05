import { Link } from '@/i18n/navigation';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';

const copy = COPY.cta;

export function CtaSection() {
  return (
    <section className='ctasec'>
      <div className='card card--cta'>
        <div className='bloom' style={{ top: 504, width: 980, height: 410 }} aria-hidden />
        <div className='card__body'>
          <h2 className='d2'>{copy.title}</h2>
          <p className='lede'>{copy.lede}</p>
          <div className='card__cta'>
            <Link className='btn btn--paper btn--lg' href='/signup'>
              {copy.primary}
            </Link>
            <a className='btn btn--onvolt btn--lg' href={LINKS.docs}>
              {copy.secondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
