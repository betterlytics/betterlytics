import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getCompetitorData } from '@/app/(app)/[locale]/(public)/vs/[competitor]/config';
import { LANGUAGE_METADATA, SUPPORTED_LANGUAGES } from '@/constants/i18n';
import { Link } from '@/i18n/navigation';
import { BlueskyIcon, DiscordIcon, GitHubIcon } from '@/components/icons/SocialIcons';
import { BrandLink } from '@/landing/components/ui/brandMark';
import { FINE_LINK } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';

const COMPARE = [
  { slug: 'google-analytics', name: 'Google Analytics' },
  { slug: 'matomo', name: 'Matomo' },
  { slug: 'plausible', name: 'Plausible' },
  { slug: 'posthog', name: 'PostHog' },
  { slug: 'fathom-analytics', name: 'Fathom Analytics' },
  { slug: 'umami', name: 'Umami' },
];

const COMPARISONS = COMPARE.filter(({ slug }) => getCompetitorData(slug) !== undefined);

const LINK =
  'flex w-fit items-center gap-[9px] py-2 text-body-sm leading-4 tracking-ui text-fg transition-opacity duration-180 ease-out-expo hover:opacity-80 max-sm:py-1 max-sm:text-body';
const SOCIAL_ICON = 'size-[15px] flex-none';

/** Plain links rather than a menu, so crawlers can follow them; the link also updates the locale cookie `/` redirects on. */
function LanguageLinks() {
  const t = useTranslations('landing.footer');
  const locale = useLocale();
  return (
    <div className='flex items-center gap-2.5 text-caption'>
      <Globe aria-hidden className='size-3.5 flex-none text-muted' />
      <ul aria-label={t('language')} className='flex flex-wrap gap-x-4'>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <li key={lang}>
            <Link
              className={cn(
                'inline-block py-1 transition-colors duration-180 ease-out-expo',
                lang === locale ? 'text-fg' : 'text-muted hover:text-fg',
              )}
              href='/'
              locale={lang}
              lang={lang}
              aria-current={lang === locale ? 'page' : undefined}
            >
              {LANGUAGE_METADATA[lang].name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

export function LandingFooter() {
  const t = useTranslations('landing.footer');
  return (
    <footer className='relative px-[calc(var(--inset)+12px)] pt-28 pb-8 max-sm:px-(--inset)'>
      <div className='flex min-h-[300px] gap-6 max-2xl:flex-wrap'>
        <div className='w-[420px] flex-none max-2xl:w-full'>
          <BrandLink />
          <p className='my-5 max-w-[34ch] text-body leading-[23px] text-muted'>{t('tagline')}</p>
          <LanguageLinks />
        </div>
        <nav
          aria-label={t('nav')}
          className='flex flex-1 gap-6 max-2xl:basis-full max-2xl:flex-wrap max-sm:gap-y-13'
        >
          <Column id='footer-company' title={t('columns.company')}>
            <li>
              <Link className={LINK} href='/about'>
                {t('company.about')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/contact'>
                {t('company.contact')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/privacy'>
                {t('company.privacy')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/terms'>
                {t('company.terms')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/dpa'>
                {t('company.dpa')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/subprocessors'>
                {t('company.subprocessors')}
              </Link>
            </li>
          </Column>
          <Column id='footer-resources' title={t('columns.resources')}>
            <li>
              <a className={LINK} href={LINKS.docs}>
                {t('resources.docs')}
              </a>
            </li>
            <li>
              <Link className={LINK} href='/changelog'>
                {t('resources.changelog')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/features'>
                {t('resources.features')}
              </Link>
            </li>
            <li>
              <Link className={LINK} href='/pricing'>
                {t('resources.pricing')}
              </Link>
            </li>
            <li>
              <a className={LINK} href={LINKS.status}>
                {t('resources.status')}
              </a>
            </li>
          </Column>
          <Column id='footer-compare' title={t('columns.compare')}>
            {COMPARISONS.map(({ slug, name }) => (
              <li key={slug}>
                <Link className={LINK} href={`/vs/${slug}`}>
                  {/* a no-break space after "vs", so a narrow column never strands it on its own line */}
                  {t('compareLink', { name }).replace(/^(\S+) /, '$1\u00a0')}
                </Link>
              </li>
            ))}
          </Column>
          <Column id='footer-connect' title={t('columns.connect')}>
            <li>
              <a className={LINK} href={LINKS.github} target='_blank' rel='noopener'>
                <GitHubIcon className={SOCIAL_ICON} />
                GitHub
              </a>
            </li>
            <li>
              <a className={LINK} href={LINKS.bluesky} target='_blank' rel='noopener'>
                <BlueskyIcon className={SOCIAL_ICON} />
                Bluesky
              </a>
            </li>
            <li>
              <a className={LINK} href={LINKS.discord} target='_blank' rel='noopener'>
                <DiscordIcon className={SOCIAL_ICON} />
                Discord
              </a>
            </li>
          </Column>
        </nav>
      </div>
      <div className='relative mt-14 flex flex-wrap items-center justify-between gap-6 pt-8 text-caption text-muted before:bleed-rule before:top-0 before:bg-rule-10'>
        <span>
          {/* a string year, or ICU groups it as 2,026 */}
          {t('copyright', { year: String(new Date().getFullYear()) })}{' '}
          {t.rich('license', {
            link: (name) => (
              <a className={cn('whitespace-nowrap', FINE_LINK)} href={LINKS.license}>
                {name}
              </a>
            ),
          })}
        </span>
        <a
          className='transition-colors duration-180 ease-out-expo hover:text-fg max-sm:order-first'
          href={LINKS.securityPolicy}
        >
          {t('reportVulnerability')}
        </a>
      </div>
    </footer>
  );
}
