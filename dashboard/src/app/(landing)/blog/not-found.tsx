import NextLink from 'next/link';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getBlogPosts } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { PageShell } from '@/landing/components/page/pageShell';
import { Section } from '@/landing/components/ui/frame';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Lede } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { PostGrid } from './_components/postGrid';
import { BLOG_GUTTER, BLOG_LOCALE, blogPath } from './_lib/blog';

/** The blog sits outside [locale], so the app's catch-all 404 never reaches it. */
export default function BlogNotFound() {
  setRequestLocale(BLOG_LOCALE);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const latest = getBlogPosts().slice(0, 3);

  return (
    <>
      <title>Post not found | Betterlytics</title>
      <PageShell
        hero={
          <header className={cn(BLOG_GUTTER, 'pt-20 pb-16 max-sm:pt-12 max-sm:pb-10')}>
            <p className='text-label tracking-ui text-muted'>404</p>
            <Heading as='h1' size='display-1' className='mt-3'>
              Post not found
            </Heading>
            <Lede className='mt-5 max-w-[56ch] text-muted'>
              This post doesn&apos;t exist, or it has moved. The latest posts are below.
            </Lede>
            <NextLink
              href={blogPath()}
              className={buttonStyles({ variant: 'line', size: 'lg', className: 'mt-8' })}
            >
              All posts
            </NextLink>
          </header>
        }
      >
        {latest.length > 0 && (
          <Section id='latest' title='Latest *posts*'>
            <PostGrid posts={latest} headingAs='h3' />
          </Section>
        )}
      </PageShell>
    </>
  );
}
