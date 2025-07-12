import Logo from '@/components/logo';
import Link from 'next/link';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';

export function Footer() {
  return (
    <footer className='border-border/40 border-t py-12'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4'>
              <Logo variant='simple' showText textSize='lg' priority />
            </div>
            <p className='text-muted-foreground text-sm'>
              Privacy-first web analytics for the modern web. GDPR compliant, cookieless, and open source.
            </p>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Company</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <Link href='/about' className='hover:text-foreground transition-colors'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='hover:text-foreground transition-colors'>
                  Contact
                </Link>
              </li>
              <li>
                <Link href='/privacy' className='hover:text-foreground transition-colors'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='hover:text-foreground transition-colors'>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href='/dpa' className='hover:text-foreground transition-colors'>
                  Data Processing Agreement
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Resources</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <a
                  href='/docs'
                  title='Complete Betterlytics Documentation'
                  className='hover:text-foreground transition-colors'
                >
                  Documentation
                </a>
              </li>
              <li>
                <Link href='/#pricing' className='hover:text-foreground transition-colors'>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Connect</h3>
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
            © 2025 Betterlytics. All rights reserved. Open source under AGPL-3.0 license.
          </p>
        </div>
      </div>
    </footer>
  );
}
