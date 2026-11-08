import type { BlogPost } from '@/content/blog';
import { Panel } from '@/landing/components/ui/frame';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';
import { PostCard } from './postCard';

export function PostGrid({
  posts,
  headingAs,
  priority = false,
  className,
}: {
  posts: BlogPost[];
  headingAs?: 'h2' | 'h3';
  /** Loads the first row's covers eagerly, for a grid that opens the page. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <Panel flush className={className}>
      <ul className={cn(ruled.grid, ruled.cols3)}>
        {posts.map((post, index) => (
          <li key={post.slug}>
            <PostCard post={post} headingAs={headingAs} priority={priority && index < 3} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
