import type { BlogPost } from '@/content/blog';
import { Panel } from '@/landing/components/ui/frame';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';
import { PostCard } from './postCard';

export function PostGrid({
  posts,
  headingAs,
  className,
}: {
  posts: BlogPost[];
  headingAs?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <Panel flush className={className}>
      <ul className={cn(ruled.grid, ruled.cols3)}>
        {posts.map((post) => (
          <li key={post.slug}>
            <PostCard post={post} headingAs={headingAs} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
