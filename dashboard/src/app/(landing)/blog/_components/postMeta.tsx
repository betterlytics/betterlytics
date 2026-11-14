import type { ReactNode } from 'react';
import { CalendarDays, Clock, History } from 'lucide-react';
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

export function PostMeta({
  post,
  showUpdated = false,
  className,
}: {
  post: BlogPost;
  showUpdated?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-label leading-5 tracking-ui text-muted',
        className,
      )}
    >
      <MetaItem icon={<CalendarDays aria-hidden className={ICON} />}>
        <time dateTime={isoDate(post.publishedAt)}>{formatBlogDate(post.publishedAt)}</time>
      </MetaItem>
      {showUpdated && post.updatedAt && (
        <MetaItem icon={<History aria-hidden className={ICON} />}>
          Updated <time dateTime={isoDate(post.updatedAt)}>{formatBlogDate(post.updatedAt)}</time>
        </MetaItem>
      )}
      <MetaItem icon={<Clock aria-hidden className={ICON} />}>{post.readingMinutes} min read</MetaItem>
    </p>
  );
}
