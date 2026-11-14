import Image from 'next/image';
import NextLink from 'next/link';
import { BLOG_COVER_IMAGE, type BlogPost } from '@/content/blog';
import { Corners } from '@/landing/components/ui/frame';
import { blogPath } from '@/app/(landing)/blog/_lib/blog';
import { PostMeta } from './postMeta';

/** Laid out like the landing's FeatureGrid cells; the title's ::after makes the whole cell the link. */
export function PostCard({
  post,
  headingAs: Title = 'h2',
  priority = false,
}: {
  post: BlogPost;
  headingAs?: 'h2' | 'h3';
  priority?: boolean;
}) {
  return (
    <article className='group relative flex h-full flex-col'>
      <Corners />
      <div className='overflow-hidden border-b border-rule-08'>
        <Image
          src={post.cover.src}
          alt=''
          {...BLOG_COVER_IMAGE}
          priority={priority}
          className='aspect-[1200/630] w-full object-cover'
        />
      </div>
      <div className='flex flex-1 flex-col px-8 pt-[30px] pb-9 max-sm:px-(--pad)'>
        <Title className='text-title leading-6 font-medium tracking-ui text-balance text-fg transition-colors duration-180 ease-out-expo group-hover:text-volt-text'>
          <NextLink
            href={blogPath(post.slug)}
            className='outline-hidden after:absolute after:inset-0 focus-visible:after:inset-ring-[1.5px] focus-visible:after:inset-ring-volt-soft/70'
          >
            {post.title}
          </NextLink>
        </Title>
        <p className='mt-2.5 mb-7 line-clamp-3 text-label leading-[22px] text-pretty text-muted'>
          {post.description}
        </p>
        <PostMeta post={post} className='mt-auto text-caption' />
      </div>
    </article>
  );
}
