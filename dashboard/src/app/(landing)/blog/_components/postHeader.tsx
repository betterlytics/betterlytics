import { ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';
import type { BlogPost } from '@/content/blog';
import { Heading, Lede } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import {
  BLOG_GUTTER,
  POST_COLUMN,
  blogPath,
  formatBlogDate,
  isoDate,
  postAuthor,
} from '@/app/(landing)/blog/_lib/blog';
import { PostMeta } from './postMeta';

export function PostHeader({ post }: { post: BlogPost }) {
  const author = postAuthor(post);
  return (
    <header className={cn(BLOG_GUTTER, 'pt-16 pb-14 max-sm:pt-10 max-sm:pb-10')}>
      <div className={POST_COLUMN}>
        <NextLink
          href={blogPath()}
          className='-my-1 inline-flex items-center gap-1.5 py-1 text-label text-muted transition-colors duration-180 ease-out-expo hover:text-fg'
        >
          <ArrowLeft aria-hidden className='size-3.5' />
          Blog
        </NextLink>
        <PostMeta post={post} className='mt-8' />
        <Heading as='h1' size='display-2' className='mt-4 text-balance'>
          {post.title}
        </Heading>
        <Lede className='mt-5 text-pretty text-muted'>{post.description}</Lede>
        <p className='mt-8 text-label tracking-ui text-muted'>
          By <span className='text-fg'>{author.name}</span>
          {author.kind === 'Person' && `, ${author.role}`}
          {post.updatedAt && (
            <>
              {' · Updated '}
              <time dateTime={isoDate(post.updatedAt)}>{formatBlogDate(post.updatedAt)}</time>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
