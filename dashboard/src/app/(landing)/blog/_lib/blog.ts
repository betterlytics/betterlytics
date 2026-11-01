import { BLOG_AUTHORS, type BlogAuthor } from '@/entities/blog/blogPost.entities';
import type { BlogPost } from '@/content/blog';
import { env } from '@/lib/env';

export const BLOG_LOCALE = 'en';

export const BLOG_COPY = {
  title: 'Blog',
  description:
    'Writing from the Betterlytics team on privacy-first analytics, GDPR, and how we build a cookieless analytics product.',
};

/** Clear of the band's hatched walls, and in line with the post cards' text. */
export const BLOG_GUTTER = 'px-[calc(var(--inset)+32px)] max-sm:px-(--pad)';

/** One reading column, so the post header lines up with its body. */
export const POST_COLUMN = 'mx-auto max-w-[680px]';

export const blogPath = (slug?: string) => (slug ? `/blog/${slug}` : '/blog');

export const blogUrl = (slug?: string) => `${env.PUBLIC_BASE_URL}${blogPath(slug)}`;

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatBlogDate = (date: Date) => DATE_FORMAT.format(date);

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const postAuthor = (post: BlogPost): BlogAuthor => BLOG_AUTHORS[post.author];
