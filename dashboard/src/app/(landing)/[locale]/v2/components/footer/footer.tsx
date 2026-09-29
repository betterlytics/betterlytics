import type { ReactNode } from 'react';
import { getCompetitorData } from '@/app/(app)/[locale]/(public)/vs/[competitor]/config';
import { Link } from '@/i18n/navigation';
import { BlueskyIcon, DiscordIcon, GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { COPY } from '@/landing/content/copy';
import { LINKS } from '@/landing/lib/links';

const copy = COPY.footer;

/** Only competitors that still have a comparison page, so the column never links to a 404. */
const COMPARISONS = copy.compare.filter(({ slug }) => getCompetitorData(slug) !== undefined);

const LINK = 'inline-flex items-center gap-[9px] text-body-sm tracking-ui text-fg opacity-82 hover:opacity-100';
const SOCIAL_ICON = 'size-[15px] flex-none';

function Column({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className='flex-1 max-2xl:basis-[40%]'>
      <h2 id={id} className='mb-4 text-caption font-medium tracking-[-0.1px] text-muted'>
        {title}
      </h2>
      <ul aria-labelledby={id} className='*:mb-[15px]'>
        {children}
      </ul>
    </div>
  );
}

/** The same destinations as the site's shared footer, in the landing page's frame. */
export function LandingFooter() {
  return (
    <footer className='relative px-[calc(var(--inset)+12px)] pt-28 pb-8'>
      <div className='flex min-h-[300px] gap-6 max-2xl:flex-wrap'>
        <div className='w-[420px] flex-none max-2xl:w-full'>
          <BrandLink />
          <p className='my-5 max-w-[34ch] text-body leading-[23px] text-muted'>{copy.tagline}</p>
        </div>
        <nav aria-label={copy.nav} className='flex flex-1 gap-6 max-2xl:basis-full max-2xl:flex-wrap'>
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
      {/* the rule escapes the footer's padding and runs the full viewport */}
      <div className='relative mt-14 flex flex-wrap items-center justify-between gap-6 pt-8 text-caption text-muted before:bleed-rule before:top-0 before:bg-rule-10'>
        <span>{copy.copyright(new Date().getFullYear())}</span>
        <nav aria-label={copy.legal} className='flex flex-wrap gap-6'>
          <Link href='/privacy'>{copy.privacy}</Link>
          <Link href='/terms'>{copy.terms}</Link>
          <Link href='/subprocessors'>{copy.subprocessors}</Link>
          <a href={LINKS.securityPolicy}>{copy.reportVulnerability}</a>
        </nav>
      </div>
    </footer>
  );
}
