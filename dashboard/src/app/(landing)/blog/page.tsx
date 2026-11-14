import { Rss } from 'lucide-react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getBlogPosts } from '@/content/blog';
import { PageShell } from '@/landing/components/page/pageShell';
import { Section } from '@/landing/components/ui/frame';
import { Heading, Lede } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { PostGrid } from './_components/postGrid';
import { BLOG_COPY, BLOG_GUTTER, BLOG_LOCALE, blogPath } from './_lib/blog';
import { blogIndexMetadata } from './_lib/seo';

export const generateMetadata = blogIndexMetadata;

export default function BlogIndexPage() {
  setRequestLocale(BLOG_LOCALE);
  const posts = getBlogPosts();
  if (posts.length === 0) notFound();

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
      <Section id='posts' className='pt-0'>
        <PostGrid posts={posts} priority />
      </Section>
    </PageShell>
  );
}
