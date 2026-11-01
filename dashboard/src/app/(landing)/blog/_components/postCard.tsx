import Image from 'next/image';
import NextLink from 'next/link';
import type { BlogPost } from '@/content/blog';
import { cn } from '@/landing/lib/cn';
import { blogPath } from '@/app/(landing)/blog/_lib/blog';
import { PostMeta } from './postMeta';

/** The whole card is the link (its ::after covers it); the cover is decorative, as the title names the post. */
export function PostCard({ post, lead = false }: { post: BlogPost; lead?: boolean }) {
  return (
    <article
      className={cn(
        'group relative',
        lead && 'grid grid-cols-[3fr_2fr] items-center gap-12 max-xl:grid-cols-1 max-xl:gap-0',
      )}
    >
      <div className='overflow-hidden border border-rule bg-panel'>
        <Image
          src={post.cover.src}
          alt=''
          width={1200}
          height={630}
          priority={lead}
          sizes={lead ? '(width < 62.5rem) 100vw, 800px' : '(width < 40rem) 100vw, (width < 62.5rem) 50vw, 440px'}
          className='aspect-[1200/630] w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.02]'
        />
      </div>
      <div>
        <PostMeta post={post} className='mt-5' />
        <h2
          className={cn(
            'mt-2 font-medium text-balance text-fg',
            lead ? 'text-display-2' : 'text-title leading-6 tracking-ui',
          )}
        >
          <NextLink href={blogPath(post.slug)} className='after:absolute after:inset-0'>
            {post.title}
          </NextLink>
        </h2>
        <p className={cn('mt-3 text-pretty text-muted', lead ? 'text-lede' : 'line-clamp-3 text-body')}>
          {post.description}
        </p>
      </div>
    </article>
  );
}
