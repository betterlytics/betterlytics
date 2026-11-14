import { BLOG_AUTHORS, type BlogAuthor } from '@/entities/blog/blogPost.entities';
import type { BlogPost } from '@/content/blog';
import { env } from '@/lib/env';

export const BLOG_LOCALE = 'en';

export const BLOG_COPY = {
  title: 'Blog',
  description:
    'Guides to privacy-friendly analytics, engineering notes and product news from the team building Betterlytics.',
};

export const BLOG_CTA = {
  title: 'Try Betterlytics on your own site',
  lede: 'Web analytics, session replay, errors and uptime in one cookieless dashboard, hosted in the EU. The free plan needs no credit card.',
  primary: 'Get started free',
  secondary: 'View live demo',
  secondaryHref: '/demo',
  secondaryDestination: 'demo',
} as const;

/** Clear of the band's hatched walls, and in line with the post cards' text. */
export const BLOG_GUTTER = 'px-[calc(var(--inset)+32px)] max-sm:px-(--pad)';

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
