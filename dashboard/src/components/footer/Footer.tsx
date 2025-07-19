import Logo from '@/components/logo';
import Link from 'next/link';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import { loadDictionary, SupportedLanguages } from '@/dictionaries/dictionaries';

export function Footer({ language }: { language: SupportedLanguages }) {
  const dict = loadDictionary(language);

  return (
    <footer className='border-border/40 border-t py-12'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4'>
              <Logo variant='simple' showText textSize='lg' priority />
            </div>
            <p className='text-muted-foreground text-sm'>
              {dict.public.footer.description}
            </p>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{dict.public.footer.company}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <Link href={`/${language}/about`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.about}
                </Link>
              </li>
              <li>
                <Link href={`/${language}/contact`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.contact}
                </Link>
              </li>
              <li>
                <Link href={`/${language}/privacy`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href={`/${language}/terms`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.termsOfService}
                </Link>
              </li>
              <li>
                <Link href={`/${language}/dpa`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.dataProcessingAgreement}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{dict.public.footer.resources}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <a
                  href='/docs'
                  title={dict.public.footer.documentationTitle}
                  className='hover:text-foreground transition-colors'
                >
                  {dict.public.footer.documentation}
                </a>
              </li>
              <li>
                <Link href={`/${language}/#pricing`} className='hover:text-foreground transition-colors'>
                  {dict.public.footer.pricing}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>{dict.public.footer.connect}</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <Link
                  href='https://github.com/betterlytics/betterlytics'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <GitHubIcon className='mr-2 h-4 w-4' />
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href='https://bsky.app/profile/betterlytics.bsky.social'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <BlueskyIcon className='mr-2 h-4 w-4' />
                  Bluesky
                </Link>
              </li>
              <li>
                <Link
                  href='https://discord.com/invite/vwqSvPn6sP'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <DiscordIcon className='mr-2 h-4 w-4' />
                  Discord
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='border-border/40 mt-8 border-t pt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            {dict.public.footer.rightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
