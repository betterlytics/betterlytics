import type { Metadata } from 'next';
import Image from 'next/image';
import NextLink from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { getBlogPost, getViewableBlogPosts, type BlogPost } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { cn } from '@/landing/lib/cn';
import { PostBody } from '@/app/(landing)/blog/_components/postBody';
import { PostHeader } from '@/app/(landing)/blog/_components/postHeader';
import { BLOG_LOCALE, blogPath } from '@/app/(landing)/blog/_lib/blog';
import { blogPostJsonLd, blogPostMetadata } from '@/app/(landing)/blog/_lib/seo';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getViewableBlogPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  return post ? blogPostMetadata(post) : {};
}

function NeighbourLink({ post, label, className }: { post: BlogPost; label: string; className?: string }) {
  return (
    <NextLink href={blogPath(post.slug)} className={cn('group flex flex-col gap-1.5', className)}>
      <span className='text-label text-muted'>{label}</span>
      <span className='text-title leading-6 font-medium tracking-ui text-balance text-fg transition-opacity duration-180 ease-out-expo group-hover:opacity-80'>
        {post.title}
      </span>
    </NextLink>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  setRequestLocale(BLOG_LOCALE);
  if (!isClientFeatureEnabled('isCloud')) {
    redirect('/dashboards');
  }
  const post = getBlogPost(slug);
  if (!post) notFound();

  const posts = getViewableBlogPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  const [newer, older] = [posts[index - 1], posts[index + 1]];

  return (
    <>
      <JsonLd data={blogPostJsonLd(post)} />
      <PageShell hero={<PostHeader post={post} />} after={<CtaSection />}>
        <article className='px-(--inset) pt-12 pb-24 max-sm:px-(--pad) max-sm:pt-8 max-sm:pb-16'>
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            width={1200}
            height={630}
            priority
            sizes='(width < 67.5rem) 100vw, 1000px'
            className='mx-auto aspect-[1200/630] w-full max-w-[1000px] border border-rule object-cover'
          />
          <div className='mx-auto mt-14 max-w-[680px] max-sm:mt-10'>
            <PostBody source={post.source} />
          </div>
          {(older || newer) && (
            <nav
              aria-label='More posts'
              className='mx-auto mt-20 grid max-w-[680px] grid-cols-2 gap-8 border-t border-rule pt-8 max-sm:grid-cols-1'
            >
              {older ? <NeighbourLink post={older} label='Previous post' /> : <span className='max-sm:hidden' />}
              {newer && <NeighbourLink post={newer} label='Next post' className='text-right max-sm:text-left' />}
            </nav>
          )}
        </article>
      </PageShell>
    </>
  );
}
