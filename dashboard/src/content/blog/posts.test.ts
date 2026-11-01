import fs from 'node:fs';
import path from 'node:path';
import { evaluate } from 'next-mdx-remote-client/rsc';
import { describe, expect, it } from 'vitest';
import { BLOG_MDX_OPTIONS } from '@/app/(landing)/blog/_lib/mdx';
import { BlogFrontmatterSchema } from '@/entities/blog/blogPost.entities';
import { getAllBlogPosts } from './index';

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

// getAllBlogPosts throws on a bad slug or frontmatter, which fails this file
describe.each(getAllBlogPosts().map((post) => [post.slug, post] as const))('blog post %s', (_, post) => {
  it('has its cover in public/', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public', post.cover.src))).toBe(true);
  });

  it('compiles', async () => {
    const { error } = await evaluate({ source: post.source, options: BLOG_MDX_OPTIONS });
    expect(error).toBeUndefined();
  });
});
