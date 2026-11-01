import { evaluate } from 'next-mdx-remote-client/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogFrontmatterSchema } from '@/entities/blog/blogPost.entities';
import {
  getAllBlogPosts,
  getPublishedBlogPosts,
  getRelatedBlogPosts,
  getViewableBlogPosts,
  type BlogPost,
} from './index';
import { BLOG_MDX_COMPONENTS, BLOG_MDX_OPTIONS } from './mdx';

const VALID = {
  title: 'A title long enough',
  description: 'A description that is long enough to pass the fifty character minimum.',
  publishedAt: '2026-11-01',
  author: 'team',
  cover: { src: '/blog/a-post/cover.png', alt: 'A cover image alt text' },
};

describe('BlogFrontmatterSchema', () => {
  it('accepts a minimal post and defaults tags and draft', () => {
    const parsed = BlogFrontmatterSchema.parse(VALID);
    expect(parsed.tags).toEqual([]);
    expect(parsed.draft).toBe(false);
    expect(parsed.publishedAt.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('rejects unknown keys, unknown authors, bad dates and covers outside public/blog', () => {
    for (const post of [
      { ...VALID, keywords: ['seo'] },
      { ...VALID, author: 'nobody' },
      { ...VALID, publishedAt: '1 November 2026' },
      { ...VALID, cover: { ...VALID.cover, src: '/images/cover.png' } },
      { ...VALID, cover: { ...VALID.cover, src: '/blog/a-post/cover.webp' } },
    ]) {
      expect(BlogFrontmatterSchema.safeParse(post).success).toBe(false);
    }
  });
});

describe('drafts', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('show under next dev only', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getViewableBlogPosts().some((post) => post.draft)).toBe(false);
    expect(getPublishedBlogPosts().some((post) => post.draft)).toBe(false);
    vi.stubEnv('NODE_ENV', 'development');
    expect(getViewableBlogPosts()).toHaveLength(getAllBlogPosts().length);
  });
});

describe('getRelatedBlogPosts', () => {
  const post = (slug: string, tags: string[]) => ({ slug, tags }) as BlogPost;

  it('puts posts sharing the first tag first, keeps the newest-first order, and skips the post itself', () => {
    const posts = [post('a', ['Product']), post('b', ['Guides']), post('c', ['Product']), post('d', ['Product'])];
    expect(getRelatedBlogPosts(posts[0], 3, posts).map((p) => p.slug)).toEqual(['c', 'd', 'b']);
    expect(getRelatedBlogPosts(posts[1], 2, posts).map((p) => p.slug)).toEqual(['a', 'c']);
  });
});

// getAllBlogPosts throws on a bad file name, frontmatter or cover, which fails this file
describe.each(getAllBlogPosts().map((post) => [post.slug, post] as const))('blog post %s', (_, post) => {
  it('compiles and renders', async () => {
    const { content, error } = await evaluate({
      source: post.source,
      options: BLOG_MDX_OPTIONS,
      components: BLOG_MDX_COMPONENTS,
    });
    expect(error).toBeUndefined();
    expect(() => renderToStaticMarkup(content)).not.toThrow();
  });
});
