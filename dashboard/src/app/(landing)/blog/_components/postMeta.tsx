import type { BlogPost } from '@/content/blog';
import { cn } from '@/landing/lib/cn';
import { formatBlogDate, isoDate } from '@/app/(landing)/blog/_lib/blog';

export function PostMeta({ post, className }: { post: BlogPost; className?: string }) {
  const [tag] = post.tags;
  return (
    <p
      className={cn('flex flex-wrap items-center gap-x-2 text-label leading-5 tracking-ui text-muted', className)}
    >
      {post.draft && <span className='rounded-full border border-warn/40 px-2 text-caption text-warn'>Draft</span>}
      {tag && (
        <>
          <span className='text-fg'>{tag}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <time dateTime={isoDate(post.publishedAt)}>{formatBlogDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} min read</span>
    </p>
  );
}
