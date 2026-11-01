import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getViewableBlogPosts } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { PageShell } from '@/landing/components/page/pageShell';
import { Section } from '@/landing/components/ui/frame';
import { Heading, Lede } from '@/landing/components/ui/text';
import { PostCard } from './_components/postCard';
import { BLOG_COPY, BLOG_LOCALE } from './_lib/blog';
import { blogIndexMetadata } from './_lib/seo';

export const metadata = blogIndexMetadata();

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
        <header className='px-(--inset) pt-20 pb-16 max-sm:px-(--pad) max-sm:pt-12 max-sm:pb-10'>
          <Heading as='h1' size='display-1'>
            {BLOG_COPY.title}
          </Heading>
          <Lede className='mt-5 max-w-[56ch] text-muted'>{BLOG_COPY.description}</Lede>
        </header>
      }
    >
      <Section id='posts' className='pt-12 max-sm:px-(--pad)'>
        <PostCard post={lead} lead />
        {rest.length > 0 && (
          <ul className='mt-20 grid grid-cols-3 gap-x-8 gap-y-14 max-xl:grid-cols-2 max-sm:mt-14 max-sm:grid-cols-1'>
            {rest.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageShell>
  );
}
