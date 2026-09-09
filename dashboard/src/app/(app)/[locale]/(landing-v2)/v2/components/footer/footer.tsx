import { Link } from '@/i18n/navigation';
import { BlueskyIcon, DiscordIcon, GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandMark } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/brandMark';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';

const copy = COPY.footer;

/** Same destinations as the shared site footer, in the landing page's own frame. */
export function LandingFooter() {
  return (
    <footer className='foot'>
      <div className='foot__top'>
        <div className='foot__brand'>
          <Link className='brand' href='/' aria-label={COPY.nav.home}>
            <BrandMark />
            <b>Betterlytics</b>
          </Link>
          <p className='foot__tag'>{copy.tagline}</p>
        </div>
        <div className='foot__col'>
          <h4>{copy.columns.company}</h4>
          <ul>
            <li>
              <Link href='/about'>{copy.company.about}</Link>
            </li>
            <li>
              <Link href='/contact'>{copy.company.contact}</Link>
            </li>
            <li>
              <Link href='/privacy'>{copy.company.privacy}</Link>
            </li>
            <li>
              <Link href='/terms'>{copy.company.terms}</Link>
            </li>
            <li>
              <Link href='/dpa'>{copy.company.dpa}</Link>
            </li>
            <li>
              <Link href='/subprocessors'>{copy.company.subprocessors}</Link>
            </li>
          </ul>
        </div>
        <div className='foot__col'>
          <h4>{copy.columns.resources}</h4>
          <ul>
            <li>
              <a href={LINKS.docs}>{copy.resources.docs}</a>
            </li>
            <li>
              <Link href='/changelog'>{copy.resources.changelog}</Link>
            </li>
            <li>
              <Link href='/features'>{copy.resources.features}</Link>
            </li>
            <li>
              <Link href='/pricing'>{copy.resources.pricing}</Link>
            </li>
            <li>
              <a href={LINKS.status}>{copy.resources.status}</a>
            </li>
          </ul>
        </div>
        <div className='foot__col'>
          <h4>{copy.columns.compare}</h4>
          <ul>
            {copy.compare.map((c) => (
              <li key={c.slug}>
                <Link href={`/vs/${c.slug}`}>vs {c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className='foot__col'>
          <h4>{copy.columns.connect}</h4>
          <ul>
            <li>
              <a href={LINKS.github} target='_blank' rel='noopener noreferrer'>
                <GitHubIcon className='soc__i' />
                {copy.connect.github}
              </a>
            </li>
            <li>
              <a href={LINKS.bluesky} target='_blank' rel='noopener noreferrer'>
                <BlueskyIcon className='soc__i' />
                {copy.connect.bluesky}
              </a>
            </li>
            <li>
              <a href={LINKS.discord} target='_blank' rel='noopener noreferrer'>
                <DiscordIcon className='soc__i' />
                {copy.connect.discord}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className='foot__bot'>
        <span>{copy.copyright(new Date().getFullYear())}</span>
        <nav aria-label={copy.legal}>
          <Link href='/privacy'>{copy.privacy}</Link>
          <Link href='/terms'>{copy.terms}</Link>
          <Link href='/subprocessors'>{copy.subprocessors}</Link>
          <a href={LINKS.securityPolicy}>{copy.reportVulnerability}</a>
        </nav>
      </div>
    </footer>
  );
}
