import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { BLOG_COVER_SIZE, getBlogPost, getBlogPosts, getOtherBlogPosts } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { Section } from '@/landing/components/ui/frame';
import { cn } from '@/landing/lib/cn';
import { PostBody } from '@/app/(landing)/blog/_components/postBody';
import { PostGrid } from '@/app/(landing)/blog/_components/postGrid';
import { PostHeader } from '@/app/(landing)/blog/_components/postHeader';
import { BLOG_CTA, BLOG_GUTTER, BLOG_LOCALE, POST_COLUMN } from '@/app/(landing)/blog/_lib/blog';
import { blogPostJsonLd, blogPostMetadata } from '@/app/(landing)/blog/_lib/seo';

type Props = { params: Promise<{ slug: string }> };

// next.config.ts rewrites unknown slugs to one prerendered 404; this stops any that slip past from caching their own
export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  return post ? blogPostMetadata(post) : {};
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  setRequestLocale(BLOG_LOCALE);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = getOtherBlogPosts(post);

  return (
    <>
      <JsonLd data={blogPostJsonLd(post)} />
      <PageShell hero={<PostHeader post={post} />} after={<CtaSection copy={BLOG_CTA} />}>
        <article className={cn(BLOG_GUTTER, 'pt-12 pb-24 max-sm:pt-8 max-sm:pb-16')}>
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            {...BLOG_COVER_SIZE}
            priority
            sizes='(width < 67.5rem) 100vw, 1000px'
            className='mx-auto aspect-[1200/630] w-full max-w-[1000px] border border-rule object-cover'
          />
          <div className={cn(POST_COLUMN, 'mt-14 max-sm:mt-10')}>
            <PostBody source={post.source} />
          </div>
        </article>
        {related.length > 0 && (
          <Section id='keep-reading' title='Keep *reading*'>
            <PostGrid posts={related} headingAs='h3' />
          </Section>
        )}
      </PageShell>
    </>
  );
}
