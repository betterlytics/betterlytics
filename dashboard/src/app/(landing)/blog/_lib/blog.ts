import { BLOG_AUTHORS, type BlogAuthor } from '@/entities/blog/blogPost.entities';
import type { BlogPost } from '@/content/blog';
import { env } from '@/lib/env';

export const BLOG_LOCALE = 'en';

export const BLOG_COPY = {
  title: 'Blog',
  description:
    'Writing from the Betterlytics team on privacy-first analytics, GDPR, and how we build a cookieless analytics product.',
};

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
