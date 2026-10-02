import type { ReactNode } from 'react';
import { getCompetitorData } from '@/app/(app)/[locale]/(public)/vs/[competitor]/config';
import { Link } from '@/i18n/navigation';
import { BlueskyIcon, DiscordIcon, GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { COPY } from '@/landing/content/copy';
import { LINKS } from '@/landing/lib/links';

const copy = COPY.footer;

/** Skip competitors without a comparison page, so no link 404s. */
const COMPARISONS = copy.compare.filter(({ slug }) => getCompetitorData(slug) !== undefined);

const LINK =
  'flex w-fit items-center gap-[9px] py-2 text-body-sm leading-4 tracking-ui text-fg transition-opacity duration-180 ease-out-expo hover:opacity-80 max-sm:py-1 max-sm:text-body';
const SOCIAL_ICON = 'size-[15px] flex-none';
/** Underlined so it isn't told from its sentence by colour alone. */
const FINE_LINK =
  'underline decoration-rule-30 underline-offset-[3px] transition-colors duration-180 ease-out-expo hover:text-fg hover:decoration-current';

function Column({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className='flex-1 max-2xl:basis-[40%]'>
      <h2 id={id} className='mb-2 text-caption font-medium tracking-[-0.1px] text-muted max-sm:mb-1'>
        {title}
      </h2>
      <ul aria-labelledby={id}>{children}</ul>
    </div>
  );
}

/** Same destinations as the site's shared footer. */
export function LandingFooter() {
  return (
    <footer className='relative px-[calc(var(--inset)+12px)] pt-28 pb-8 max-sm:px-(--inset)'>
      <div className='flex min-h-[300px] gap-6 max-2xl:flex-wrap'>
        <div className='w-[420px] flex-none max-2xl:w-full'>
          <BrandLink />
          <p className='my-5 max-w-[34ch] text-body leading-[23px] text-muted'>{copy.tagline}</p>
        </div>
        <nav
          aria-label={copy.nav}
          className='flex flex-1 gap-6 max-2xl:basis-full max-2xl:flex-wrap max-sm:gap-y-13'
        >
          <Column id='footer-company' title={copy.columns.company}>
            <li>
              <Link className={LINK} href='/about'>
                {copy.company.about}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/contact'>
                {copy.company.contact}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/privacy'>
                {copy.company.privacy}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/terms'>
                {copy.company.terms}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/dpa'>
                {copy.company.dpa}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/subprocessors'>
                {copy.company.subprocessors}
              </Link>
            </li>
          </Column>
          <Column id='footer-resources' title={copy.columns.resources}>
            <li>
              <a className={LINK} href={LINKS.docs}>
                {copy.resources.docs}
              </a>
            </li>
            <li>
              <Link className={LINK} href='/changelog'>
                {copy.resources.changelog}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/features'>
                {copy.resources.features}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/pricing'>
                {copy.resources.pricing}
              </Link>
            </li>
            <li>
              <a className={LINK} href={LINKS.status}>
                {copy.resources.status}
              </a>
            </li>
          </Column>
          <Column id='footer-compare' title={copy.columns.compare}>
            {COMPARISONS.map(({ slug, name }) => (
              <li key={slug}>
                <Link className={LINK} href={`/vs/${slug}`}>
                  {copy.compareLink(name)}
                </Link>
              </li>
            ))}
          </Column>
          <Column id='footer-connect' title={copy.columns.connect}>
            <li>
              <a className={LINK} href={LINKS.github} target='_blank' rel='noopener noreferrer'>
                <GitHubIcon className={SOCIAL_ICON} />
                {copy.connect.github}
              </a>
            </li>
            <li>
              <a className={LINK} href={LINKS.bluesky} target='_blank' rel='noopener noreferrer'>
                <BlueskyIcon className={SOCIAL_ICON} />
                {copy.connect.bluesky}
              </a>
            </li>
            <li>
              <a className={LINK} href={LINKS.discord} target='_blank' rel='noopener noreferrer'>
                <DiscordIcon className={SOCIAL_ICON} />
                {copy.connect.discord}
              </a>
            </li>
          </Column>
        </nav>
      </div>
      <div className='relative mt-14 flex flex-wrap items-center justify-between gap-6 pt-8 text-caption text-muted before:bleed-rule before:top-0 before:bg-rule-10'>
        <span>
          {copy.copyright(new Date().getFullYear())} {copy.license.lead}{' '}
          <a className={FINE_LINK} href={LINKS.license}>
            {copy.license.name}
          </a>{' '}
          {copy.license.tail}
        </span>
        {/* first on phones so the copyright stays the page's last line */}
        <a
          className='transition-colors duration-180 ease-out-expo hover:text-fg max-sm:order-first'
          href={LINKS.securityPolicy}
        >
          {copy.reportVulnerability}
        </a>
      </div>
    </footer>
  );
}
