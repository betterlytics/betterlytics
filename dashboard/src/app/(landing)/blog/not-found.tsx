import NextLink from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/landing/components/page/pageShell';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { BLOG_GUTTER, BLOG_LOCALE, blogPath } from './_lib/blog';

/** The blog sits outside [locale], so the app's catch-all 404 never reaches it. */
export default function BlogNotFound() {
  setRequestLocale(BLOG_LOCALE);
  return (
    <>
      <title>Page Not Found | Betterlytics</title>
      <PageShell
        hero={
          <header className={cn(BLOG_GUTTER, 'pt-24 pb-28 max-sm:pt-14 max-sm:pb-16')}>
            <p className='text-label tracking-ui text-muted'>404</p>
            <Heading as='h1' size='display-1' className='mt-3'>
              Page Not Found
            </Heading>
            <Lede className='mt-5 max-w-[48ch] text-muted'>
              This link leads nowhere. The post may have moved, or the address has a typo.
            </Lede>
            <NextLink
              href={blogPath()}
              className={buttonStyles({ variant: 'volt', size: 'lg', className: 'mt-9' })}
            >
              Back to the blog
            </NextLink>
          </header>
        }
      >
        {null}
      </PageShell>
    </>
  );
}
