import type { ReactNode } from 'react';
import { CalendarDays, Clock, Tag } from 'lucide-react';
import type { BlogPost } from '@/content/blog';
import { cn } from '@/landing/lib/cn';
import { formatBlogDate, isoDate } from '@/app/(landing)/blog/_lib/blog';

const ICON = 'size-3.5 flex-none opacity-70';

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      {icon}
      {children}
    </span>
  );
}

export function DraftBadge({ post }: { post: BlogPost }) {
  if (!post.draft) return null;
  return <span className='rounded-full border border-warn/40 px-2 text-caption text-warn'>Draft</span>;
}

export function PostDateline({ post }: { post: BlogPost }) {
  return (
    <>
      <MetaItem icon={<CalendarDays aria-hidden className={ICON} />}>
        <time dateTime={isoDate(post.publishedAt)}>{formatBlogDate(post.publishedAt)}</time>
      </MetaItem>
      <MetaItem icon={<Clock aria-hidden className={ICON} />}>{post.readingMinutes} min read</MetaItem>
    </>
  );
}

export const META_ROW = 'flex flex-wrap items-center gap-x-4 gap-y-1 text-label leading-5 tracking-ui text-muted';

export function PostMeta({ post, className }: { post: BlogPost; className?: string }) {
  const [tag] = post.tags;
  return (
    <p className={cn(META_ROW, className)}>
      <DraftBadge post={post} />
      {tag && (
        <MetaItem icon={<Tag aria-hidden className={ICON} />}>
          <span className='text-fg'>{tag}</span>
        </MetaItem>
      )}
      <PostDateline post={post} />
    </p>
  );
}
