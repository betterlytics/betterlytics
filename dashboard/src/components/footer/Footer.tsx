import Logo from '@/components/logo';
import { Link } from '@/i18n/navigation';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('public.footer');
  return (
    <footer className='border-border/40 border-t py-12'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4'>
              <Logo variant='simple' showText textSize='lg' priority />
            </div>
            <p className='text-muted-foreground text-sm'>{t('blurb')}</p>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{t('company')}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <Link href='/about' className='hover:text-foreground transition-colors'>
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href='/contact' className='hover:text-foreground transition-colors'>
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href='/privacy' className='hover:text-foreground transition-colors'>
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href='/terms' className='hover:text-foreground transition-colors'>
                  {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href='/dpa' className='hover:text-foreground transition-colors'>
                  {t('dpa')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{t('resources')}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <ExternalLink
                  href='/docs'
                  title={t('documentation')}
                  className='hover:text-foreground transition-colors'
                >
                  {t('documentation')}
                </ExternalLink>
              </li>
              <li>
                <Link href='/#pricing' className='hover:text-foreground transition-colors'>
                  {t('pricing')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{t('connect')}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <ExternalLink
                  href='https://github.com/betterlytics/betterlytics'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <GitHubIcon className='mr-2 h-4 w-4' />
                  {t('github')}
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://bsky.app/profile/betterlytics.bsky.social'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <BlueskyIcon className='mr-2 h-4 w-4' />
                  {t('bluesky')}
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://discord.com/invite/vwqSvPn6sP'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <DiscordIcon className='mr-2 h-4 w-4' />
                  {t('discord')}
                </ExternalLink>
              </li>
            </ul>
          </div>
        </div>
        <div className='border-border/40 mt-8 border-t pt-8 text-center'>
          <p className='text-muted-foreground text-sm'>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
