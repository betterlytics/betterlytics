import { Rss } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getViewableBlogPosts } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { PageShell } from '@/landing/components/page/pageShell';
import { Panel, Section } from '@/landing/components/ui/frame';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { Heading, Lede } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { PostCard } from './_components/postCard';
import { BLOG_COPY, BLOG_GUTTER, BLOG_LOCALE, blogPath } from './_lib/blog';
import { blogIndexMetadata } from './_lib/seo';

export const generateMetadata = blogIndexMetadata;

export default function BlogIndexPage() {
  setRequestLocale(BLOG_LOCALE);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const [lead, ...rest] = getViewableBlogPosts();
  // unlinked and out of the sitemap until the first post is published
  if (!lead) notFound();

  return (
    <PageShell
      hero={
        <header className={cn(BLOG_GUTTER, 'pt-20 pb-16 max-sm:pt-12 max-sm:pb-10')}>
          <Heading as='h1' size='display-1'>
            {BLOG_COPY.title}
          </Heading>
          <Lede className='mt-5 max-w-[56ch] text-muted'>{BLOG_COPY.description}</Lede>
          <a
            href={`${blogPath()}/rss.xml`}
            className='mt-6 inline-flex items-center gap-1.5 text-label text-muted transition-colors duration-180 ease-out-expo hover:text-fg'
          >
            <Rss aria-hidden className='size-3.5' />
            RSS feed
          </a>
        </header>
      }
    >
      <Section id='posts' className='pt-12'>
        <Panel flush>
          <PostCard post={lead} lead />
        </Panel>
        {rest.length > 0 && (
          <Panel flush className='mt-16 max-sm:mt-12'>
            <ul className={cn(ruled.grid, ruled.cols3)}>
              {rest.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </Section>
    </PageShell>
  );
}
