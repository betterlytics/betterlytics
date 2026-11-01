import Image from 'next/image';
import NextLink from 'next/link';
import type { BlogPost } from '@/content/blog';
import { Corners } from '@/landing/components/ui/frame';
import { cn } from '@/landing/lib/cn';
import { blogPath } from '@/app/(landing)/blog/_lib/blog';
import { DraftBadge, META_ROW, PostDateline } from './postMeta';

/** Laid out like the landing's FeatureGrid cells; the title's ::after makes the whole cell the link. */
export function PostCard({
  post,
  lead = false,
  headingAs: Title = 'h2',
}: {
  post: BlogPost;
  lead?: boolean;
  headingAs?: 'h2' | 'h3';
}) {
  const [tag] = post.tags;
  return (
    <article className={cn('group relative flex h-full flex-col', lead && '3xl:grid 3xl:grid-cols-[3fr_2fr]')}>
      <Corners />
      <div
        className={cn(
          'overflow-hidden border-b border-rule-08',
          lead && '3xl:relative 3xl:min-h-[400px] 3xl:border-r 3xl:border-b-0',
        )}
      >
        <Image
          src={post.cover.src}
          alt=''
          width={1200}
          height={630}
          priority={lead}
          sizes={lead ? '(width < 75rem) 100vw, 800px' : '(width < 40rem) 100vw, (width < 62.5rem) 50vw, 440px'}
          className={cn(
            'aspect-[1200/630] w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.02]',
            // fills the cell when the text beside it runs taller than the cover
            lead && '3xl:absolute 3xl:inset-0 3xl:aspect-auto 3xl:h-full',
          )}
        />
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col px-8 pt-[30px] pb-9 max-sm:px-(--pad)',
          lead && '3xl:justify-center 3xl:px-12 3xl:py-12',
        )}
      >
        <p className='flex items-center gap-2.5 text-label leading-5 tracking-ui text-volt-text'>
          <DraftBadge post={post} />
          {tag}
        </p>
        <Title
          className={cn(
            'mt-2.5 font-medium text-balance text-fg',
            lead
              ? 'text-display-2 max-sm:text-[2rem] max-sm:leading-9 3xl:text-[2.5rem] 3xl:leading-[2.75rem]'
              : 'text-title leading-6 tracking-ui',
          )}
        >
          <NextLink
            href={blogPath(post.slug)}
            className='outline-hidden after:absolute after:inset-0 focus-visible:after:inset-ring-[1.5px] focus-visible:after:inset-ring-volt-soft/70'
          >
            {post.title}
          </NextLink>
        </Title>
        <p
          className={cn(
            'mt-2.5 mb-7 text-pretty text-muted',
            lead ? 'text-lede' : 'line-clamp-3 text-label leading-[22px]',
          )}
        >
          {post.description}
        </p>
        <p className={cn(META_ROW, 'mt-auto text-caption')}>
          <PostDateline post={post} />
        </p>
      </div>
    </article>
  );
}
